import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getAdminSupabase() {
  if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7).trim() || null;
}

function jsonError(message: string, status = 500, extra?: Record<string, unknown>) {
  return NextResponse.json(
    { success: false, error: message, ...extra },
    { status }
  );
}

const withdrawalSelect = `
  id,
  user_id,
  amount,
  bank_name,
  account_name,
  account_number,
  status,
  created_at,
  processed_at,
  bank_transaction_code,
  payment_note
`;

export async function GET(request: NextRequest) {
  try {
    const accessToken = getBearerToken(request);
    if (!accessToken) return jsonError("Unauthorized", 401);

    await requireAdmin(accessToken);
    const adminSupabase = getAdminSupabase();

    const { data, error } = await adminSupabase
      .from("withdrawals")
      .select(withdrawalSelect)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Load withdrawals error:", error);
      return jsonError("Không thể tải danh sách yêu cầu rút tiền.", 500, {
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
    }

    return NextResponse.json({ success: true, withdrawals: data ?? [] });
  } catch (error) {
    console.error("Admin withdrawals GET error:", error);
    return jsonError(
      error instanceof Error ? error.message : "Unauthorized",
      401
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const accessToken = getBearerToken(request);
    if (!accessToken) return jsonError("Unauthorized", 401);

    await requireAdmin(accessToken);
    const adminSupabase = getAdminSupabase();

    let body: {
      id?: unknown;
      status?: unknown;
      transaction_code?: unknown;
      payment_note?: unknown;
    };

    try {
      body = await request.json();
    } catch {
      return jsonError("Request body không hợp lệ.", 400);
    }

    const id = String(body.id ?? "").trim();
    const status = String(body.status ?? "").trim();
    const transactionCode = String(body.transaction_code ?? "").trim();
    const paymentNote = String(body.payment_note ?? "").trim();

    if (!id) return jsonError("Thiếu withdrawal id.", 400);

    if (!["processing", "rejected", "paid"].includes(status)) {
      return jsonError("Trạng thái không hợp lệ.", 400);
    }

    const { data: withdrawal, error: findError } = await adminSupabase
      .from("withdrawals")
      .select(withdrawalSelect)
      .eq("id", id)
      .maybeSingle();

    if (findError) {
      return jsonError("Không thể tìm yêu cầu rút tiền.", 500, {
        code: findError.code,
        details: findError.details,
        hint: findError.hint,
      });
    }

    if (!withdrawal) return jsonError("Không tìm thấy yêu cầu rút tiền.", 404);

    const currentStatus = String(withdrawal.status);

    if (status === "processing" && currentStatus === "requested") {
      const { data, error } = await adminSupabase
        .from("withdrawals")
        .update({ status: "processing" })
        .eq("id", id)
        .eq("status", "requested")
        .select(withdrawalSelect)
        .maybeSingle();

      if (error) {
        return jsonError("Không thể chuyển yêu cầu sang đang xử lý.", 500, {
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
      }

      if (!data) return jsonError("Yêu cầu đã được xử lý bởi phiên khác.", 409);

      return NextResponse.json({
        success: true,
        message: "Đã chuyển yêu cầu sang trạng thái đang xử lý.",
        withdrawal: data,
      });
    }

    if (
      status === "rejected" &&
      (currentStatus === "requested" || currentStatus === "processing")
    ) {
      const { data, error } = await adminSupabase
        .from("withdrawals")
        .update({
          status: "rejected",
          processed_at: new Date().toISOString(),
        })
        .eq("id", id)
        .in("status", ["requested", "processing"])
        .select(withdrawalSelect)
        .maybeSingle();

      if (error) {
        return jsonError("Không thể từ chối yêu cầu.", 500, {
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
      }

      if (!data) return jsonError("Yêu cầu đã được xử lý bởi phiên khác.", 409);

      return NextResponse.json({
        success: true,
        message: "Đã từ chối yêu cầu rút tiền.",
        withdrawal: data,
      });
    }

    if (status === "paid" && currentStatus === "processing") {
      if (!transactionCode) {
        return jsonError("Vui lòng nhập mã giao dịch ngân hàng.", 400);
      }

      const { data: payment, error } = await adminSupabase.rpc(
        "process_withdrawal_payment",
        {
          p_withdrawal_id: id,
          p_bank_transaction_code: transactionCode,
          p_payment_note: paymentNote || null,
        }
      );

      if (error) {
        console.error("Process withdrawal payment error:", error);
        const message = error.message || "";

        if (message.includes("WITHDRAWAL_NOT_FOUND")) {
          return jsonError("Không tìm thấy yêu cầu rút tiền.", 404);
        }
        if (message.includes("INVALID_WITHDRAWAL_STATUS")) {
          return jsonError("Yêu cầu không còn ở trạng thái đang xử lý.", 400);
        }
        if (message.includes("INSUFFICIENT_BALANCE")) {
          return jsonError("Số dư ví không đủ để thanh toán yêu cầu này.", 400);
        }
        if (message.includes("TRANSACTION_CODE_REQUIRED")) {
          return jsonError("Vui lòng nhập mã giao dịch ngân hàng.", 400);
        }
        if (
          message.includes("TRANSACTION_CODE_ALREADY_USED") ||
          error.code === "23505"
        ) {
          return jsonError("Mã giao dịch ngân hàng này đã được sử dụng.", 409);
        }

        return jsonError(message || "Không thể ghi nhận thanh toán.", 500, {
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
      }

      return NextResponse.json({
        success: true,
        message: "Đã ghi nhận thanh toán và trừ tiền khỏi ví.",
        payment,
      });
    }

    return jsonError(`Không thể chuyển ${currentStatus} → ${status}.`, 400, {
      current_status: currentStatus,
      requested_status: status,
    });
  } catch (error) {
    console.error("Admin withdrawals PATCH error:", error);
    return jsonError(
      error instanceof Error
        ? error.message
        : "Có lỗi xảy ra khi xử lý withdrawal.",
      500
    );
  }
}
