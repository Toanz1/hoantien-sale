import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminSupabase = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

function getBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization");

  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice(7);
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = getBearerToken(request);

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const amount = Number(body.amount);
    const bankName = String(body.bank_name || "").trim();
    const accountName = String(body.account_name || "").trim();
    const accountNumber = String(body.account_number || "").trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Số tiền không hợp lệ." },
        { status: 400 }
      );
    }

    if (!bankName || !accountName || !accountNumber) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ thông tin ngân hàng." },
        { status: 400 }
      );
    }

    /*
     * Tính số dư hiện tại.
     */
    const { data: ledger, error: ledgerError } =
      await adminSupabase
        .from("wallet_ledger")
        .select("amount")
        .eq("user_id", user.id);

    if (ledgerError) {
      console.error("wallet ledger error:", ledgerError);

      return NextResponse.json(
        { error: "Không thể kiểm tra số dư ví." },
        { status: 500 }
      );
    }

    const walletBalance = (ledger || []).reduce(
      (sum, row) => sum + Number(row.amount || 0),
      0
    );

    /*
     * Các yêu cầu đang requested sẽ được xem là
     * số tiền đã giữ chỗ, tránh gửi nhiều yêu cầu vượt số dư.
     */
    const { data: pendingWithdrawals, error: withdrawalError } =
      await adminSupabase
        .from("withdrawals")
        .select("amount")
        .eq("user_id", user.id)
        .eq("status", "requested");

    if (withdrawalError) {
      console.error(
        "withdrawals lookup error:",
        withdrawalError
      );

      return NextResponse.json(
        { error: "Không thể kiểm tra yêu cầu rút tiền." },
        { status: 500 }
      );
    }

    const pendingAmount = (pendingWithdrawals || []).reduce(
      (sum, row) => sum + Number(row.amount || 0),
      0
    );

    const availableBalance = Math.max(
      0,
      walletBalance - pendingAmount
    );

    if (amount > availableBalance) {
      return NextResponse.json(
        {
          error: `Số dư có thể rút chỉ còn ${new Intl.NumberFormat(
            "vi-VN"
          ).format(availableBalance)} ₫.`,
        },
        { status: 400 }
      );
    }

    /*
     * Tạo withdrawal.
     * status không cần truyền vì DB đã có default:
     * requested
     */
    const { data, error } = await adminSupabase
      .from("withdrawals")
      .insert({
        user_id: user.id,
        amount,
        bank_name: bankName,
        account_name: accountName,
        account_number: accountNumber,
      })
      .select(
        "id, amount, bank_name, account_name, account_number, status, created_at"
      )
      .single();

    if (error) {
      console.error("create withdrawal error:", error);

      return NextResponse.json(
        { error: "Không thể tạo yêu cầu rút tiền." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      withdrawal: data,
    });
  } catch (error) {
    console.error("withdrawal API error:", error);

    return NextResponse.json(
      { error: "Có lỗi xảy ra trên server." },
      { status: 500 }
    );
  }
}