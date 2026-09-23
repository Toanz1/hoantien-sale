import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

export async function GET(request: Request) {
  try {
    /*
     * =========================================
     * PRODUCTION GUARD
     * =========================================
     */

    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          success: false,
          error: "MOCK_DISABLED_IN_PRODUCTION",
        },
        { status: 403 }
      );
    }

    /*
     * =========================================
     * ADMIN AUTH
     * =========================================
     */

    const authorization =
      request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    const accessToken = authorization
      .slice("Bearer ".length)
      .trim();

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    await requireAdmin(accessToken);

    /*
     * =========================================
     * QUERY
     * =========================================
     */

    const url = new URL(request.url);

    const trackingId =
      url.searchParams
        .get("tracking_id")
        ?.trim();

    if (!trackingId) {
      return NextResponse.json(
        {
          success: false,
          error: "MISSING_TRACKING_ID",
          message:
            "Thiếu tracking_id.",
        },
        { status: 400 }
      );
    }

    /*
     * =========================================
     * MOCK TRANSACTION
     * =========================================
     */

    const now =
      new Date().toISOString();

    const mockTransaction = {
      transaction_id:
        "TEST-TXN-001",

      merchant:
        "tiktokshop",

      status: 0,
      is_confirmed: false,

      click_time: now,
      transaction_time: now,
      update_time: now,

      transaction_value: 500000,
      commission: 25000,

      product_id:
        "1733370886315869772",

      product_price: 500000,
      product_quantity: 1,

      product_name:
        "TEST TikTok Shop Product",

      product_category:
        "Test",

      tracking_id:
        trackingId,

      conversion_id:
        "TEST-CONVERSION-001",

      conversion_platform:
        "tiktokshop",

      raw_mock: true,
    };

    /*
     * =========================================
     * RESPONSE
     * =========================================
     */

    return NextResponse.json({
      success: true,
      mock: true,

      message:
        "Đây là transaction giả lập. Chưa ghi vào database.",

      data:
        mockTransaction,
    });
  } catch (error) {
    console.error(
      "Mock ACCESSTRADE error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Không thể tạo mock transaction.";

    const lowerMessage =
      message.toLowerCase();

    if (
      lowerMessage.includes(
        "unauthorized"
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    if (
      lowerMessage.includes(
        "forbidden"
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}