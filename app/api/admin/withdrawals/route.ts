import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getAdminSupabase() {
  if (!supabaseUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL"
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

function getBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization");

  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice(7).trim() || null;
}

function jsonError(
  message: string,
  status = 500,
  extra?: Record<string, unknown>
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...extra,
    },
    { status }
  );
}

/**
 * GET
 *
 * Admin lấy toàn bộ withdrawal.
 */
export async function GET(request: NextRequest) {
  try {
    const accessToken = getBearerToken(request);

    if (!accessToken) {
      return jsonError(
        "Unauthorized",
        401
      );
    }

    await requireAdmin(accessToken);

    const adminSupabase = getAdminSupabase();

    const {
      data,
      error,
    } = await adminSupabase
      .from("withdrawals")
      .select(`
        id,
        user_id,
        amount,
        bank_name,
        account_name,
        account_number,
        status,
        created_at,
        processed_at
      `)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Load withdrawals error:",
        error
      );

      return jsonError(
        "Không thể tải danh sách yêu cầu rút tiền.",
        500,
        {
          code: error.code,
          details: error.details,
          hint: error.hint,
        }
      );
    }

    return NextResponse.json({
      success: true,
      withdrawals: data ?? [],
    });
  } catch (error) {
    console.error(
      "Admin withdrawals GET error:",
      error
    );

    return jsonError(
      error instanceof Error
        ? error.message
        : "Unauthorized",
      401
    );
  }
}

/**
 * PATCH
 *
 * Các flow hợp lệ:
 *
 * requested  -> processing
 * requested  -> rejected
 * processing -> rejected
 * processing -> paid
 */
export async function PATCH(request: NextRequest) {
  try {
    /*
     * --------------------------------------------------
     * 1. Authenticate admin
     * --------------------------------------------------
     */
    const accessToken = getBearerToken(request);

    if (!accessToken) {
      return jsonError(
        "Unauthorized",
        401
      );
    }

    await requireAdmin(accessToken);

    /*
     * --------------------------------------------------
     * 2. Supabase service-role client
     * --------------------------------------------------
     */
    const adminSupabase = getAdminSupabase();

    /*
     * --------------------------------------------------
     * 3. Parse request
     * --------------------------------------------------
     */
    let body: {
      id?: unknown;
      status?: unknown;
    };

    try {
      body = await request.json();
    } catch {
      return jsonError(
        "Request body không hợp lệ.",
        400
      );
    }

    const id = String(body.id ?? "").trim();
    const status = String(body.status ?? "").trim();

    if (!id) {
      return jsonError(
        "Thiếu withdrawal id.",
        400
      );
    }

    const allowedStatuses = [
      "processing",
      "rejected",
      "paid",
    ] as const;

    if (
      !allowedStatuses.includes(
        status as (typeof allowedStatuses)[number]
      )
    ) {
      return jsonError(
        "Trạng thái không hợp lệ. Chỉ hỗ trợ processing, rejected hoặc paid.",
        400
      );
    }

    /*
     * --------------------------------------------------
     * 4. Load withdrawal
     * --------------------------------------------------
     */
    const {
      data: withdrawal,
      error: findError,
    } = await adminSupabase
      .from("withdrawals")
      .select(`
        id,
        user_id,
        amount,
        bank_name,
        account_name,
        account_number,
        status,
        created_at,
        processed_at
      `)
      .eq("id", id)
      .maybeSingle();

    if (findError) {
      console.error(
        "Find withdrawal error:",
        findError
      );

      return jsonError(
        "Không thể tìm yêu cầu rút tiền.",
        500,
        {
          code: findError.code,
          details: findError.details,
          hint: findError.hint,
        }
      );
    }

    if (!withdrawal) {
      return jsonError(
        "Không tìm thấy yêu cầu rút tiền.",
        404
      );
    }

    const currentStatus = String(
      withdrawal.status
    );

    /*
     * --------------------------------------------------
     * 5. requested -> processing
     * --------------------------------------------------
     */
    if (
      status === "processing" &&
      currentStatus === "requested"
    ) {
      const {
        data,
        error,
      } = await adminSupabase
        .from("withdrawals")
        .update({
          status: "processing",
        })
        .eq("id", id)
        .eq("status", "requested")
        .select(`
          id,
          user_id,
          amount,
          bank_name,
          account_name,
          account_number,
          status,
          created_at,
          processed_at
        `)
        .maybeSingle();

      if (error) {
        console.error(
          "Set processing error:",
          error
        );

        return jsonError(
          "Không thể chuyển yêu cầu sang processing.",
          500,
          {
            code: error.code,
            details: error.details,
            hint: error.hint,
          }
        );
      }

      if (!data) {
        return jsonError(
          "Yêu cầu đã được xử lý bởi một phiên khác.",
          409
        );
      }

      return NextResponse.json({
        success: true,
        message:
          "Đã chuyển yêu cầu sang trạng thái processing.",
        withdrawal: data,
      });
    }

    /*
     * --------------------------------------------------
     * 6. requested / processing -> rejected
     * --------------------------------------------------
     */
    if (
      status === "rejected" &&
      (
        currentStatus === "requested" ||
        currentStatus === "processing"
      )
    ) {
      const {
        data,
        error,
      } = await adminSupabase
        .from("withdrawals")
        .update({
          status: "rejected",
          processed_at:
            new Date().toISOString(),
        })
        .eq("id", id)
        .in("status", [
          "requested",
          "processing",
        ])
        .select(`
          id,
          user_id,
          amount,
          bank_name,
          account_name,
          account_number,
          status,
          created_at,
          processed_at
        `)
        .maybeSingle();

      if (error) {
        console.error(
          "Reject withdrawal error:",
          error
        );

        return jsonError(
          "Không thể từ chối yêu cầu.",
          500,
          {
            code: error.code,
            details: error.details,
            hint: error.hint,
          }
        );
      }

      if (!data) {
        return jsonError(
          "Yêu cầu đã được xử lý bởi một phiên khác.",
          409
        );
      }

      return NextResponse.json({
        success: true,
        message:
          "Đã từ chối yêu cầu rút tiền.",
        withdrawal: data,
      });
    }

    /*
     * --------------------------------------------------
     * 7. processing -> paid
     * --------------------------------------------------
     *
     * RPC thực hiện tất cả trong một transaction:
     *
     * 1. Lock withdrawal
     * 2. Kiểm tra status = processing
     * 3. Tính balance
     * 4. Kiểm tra đủ tiền
     * 5. Insert wallet_ledger âm tiền
     * 6. Update withdrawal = paid
     */
    if (
      status === "paid" &&
      currentStatus === "processing"
    ) {
      const {
        data: payment,
        error,
      } = await adminSupabase.rpc(
        "process_withdrawal_payment",
        {
          p_withdrawal_id: id,
        }
      );

      if (error) {
        console.error(
          "Process withdrawal payment error:",
          error
        );

        console.error(
          "RPC error details:",
          {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          }
        );

        const message =
          error.message || "";

        /*
         * RPC: withdrawal không tồn tại
         */
        if (
          message.includes(
            "WITHDRAWAL_NOT_FOUND"
          )
        ) {
          return jsonError(
            "Không tìm thấy yêu cầu rút tiền.",
            404,
            {
              code: error.code,
              details: error.details,
              hint: error.hint,
            }
          );
        }

        /*
         * RPC: status không còn processing
         */
        if (
          message.includes(
            "INVALID_WITHDRAWAL_STATUS"
          )
        ) {
          return jsonError(
            "Yêu cầu này không còn ở trạng thái processing.",
            400,
            {
              code: error.code,
              details: error.details,
              hint: error.hint,
            }
          );
        }

        /*
         * RPC: không đủ số dư
         */
        if (
          message.includes(
            "INSUFFICIENT_BALANCE"
          )
        ) {
          return jsonError(
            "Số dư ví không đủ để thanh toán yêu cầu này.",
            400,
            {
              code: error.code,
              details: error.details,
              hint: error.hint,
            }
          );
        }

        /*
         * Quan trọng:
         * Trả lỗi thật để debug.
         */
        return jsonError(
          message ||
            "Không thể ghi nhận thanh toán.",
          500,
          {
            code: error.code,
            details: error.details,
            hint: error.hint,
          }
        );
      }

      return NextResponse.json({
        success: true,
        message:
          "Đã ghi nhận thanh toán và trừ tiền khỏi ví.",
        payment,
      });
    }

    /*
     * --------------------------------------------------
     * 8. Invalid transition
     * --------------------------------------------------
     *
     * Ví dụ:
     *
     * paid -> paid
     * paid -> processing
     * rejected -> paid
     * rejected -> processing
     * requested -> paid
     */
    return jsonError(
      `Không thể chuyển ${currentStatus} → ${status}.`,
      400,
      {
        current_status: currentStatus,
        requested_status: status,
      }
    );
  } catch (error) {
    console.error(
      "Admin withdrawals PATCH error:",
      error
    );

    return jsonError(
      error instanceof Error
        ? error.message
        : "Có lỗi xảy ra khi xử lý withdrawal.",
      500
    );
  }
}