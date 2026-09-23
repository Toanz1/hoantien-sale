import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

const AT_API_URL =
  "https://api.accesstrade.vn/v1/transactions";

export async function GET(request: NextRequest) {
  try {
    // =========================
    // 1. Kiểm tra access token
    // =========================
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu access token.",
        },
        { status: 401 }
      );
    }

    const accessToken = authHeader
      .replace("Bearer ", "")
      .trim();

    // =========================
    // 2. Kiểm tra quyền Admin
    // =========================
    let user;

    try {
      user = await requireAdmin(accessToken);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "FORBIDDEN";

      if (message === "UNAUTHORIZED") {
        return NextResponse.json(
          {
            success: false,
            error:
              "Bạn chưa đăng nhập hoặc phiên đã hết hạn.",
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: "Bạn không có quyền Admin.",
        },
        { status: 403 }
      );
    }

    // =========================
    // 3. Kiểm tra ACCESSTRADE API key
    // =========================
    const apiKey =
      process.env.ACCESSTRADE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "ACCESSTRADE_API_KEY chưa được cấu hình.",
        },
        { status: 500 }
      );
    }

    // =========================
    // 4. Đọc query
    // =========================
    const searchParams =
      request.nextUrl.searchParams;

    const days = Math.min(
      Math.max(
        Number(searchParams.get("days") || 30),
        1
      ),
      90
    );

    const limit = Math.min(
      Math.max(
        Number(searchParams.get("limit") || 100),
        1
      ),
      100
    );

    const page = Math.max(
      Number(searchParams.get("page") || 1),
      1
    );

    // =========================
    // 5. Tạo khoảng thời gian
    // =========================
    const until = new Date();

    const since = new Date(
      until.getTime() -
        days *
          24 *
          60 *
          60 *
          1000
    );

    // =========================
    // 6. Gọi ACCESSTRADE
    // =========================
    const params = new URLSearchParams({
      since: since.toISOString(),
      until: until.toISOString(),
      page: String(page),
      limit: String(limit),
    });

    const response = await fetch(
      `${AT_API_URL}?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Token ${apiKey}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    // =========================
    // 7. Đọc response
    // =========================
    const text = await response.text();

    let data: unknown;

    try {
      data = JSON.parse(text);
    } catch {
      data = {
        raw_response: text,
      };
    }

    // =========================
    // 8. ACCESSTRADE trả lỗi
    // =========================
    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          status: response.status,
          error:
            "ACCESSTRADE API trả về lỗi.",
          data,
        },
        {
          status: response.status,
        }
      );
    }

    // =========================
    // 9. Thành công
    // =========================
    return NextResponse.json({
      success: true,

      query: {
        days,
        limit,
        page,
        since: since.toISOString(),
        until: until.toISOString(),
      },

      user_id: user.id,

      data,
    });
  } catch (error) {
    console.error(
      "ACCESSTRADE raw debug error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Có lỗi xảy ra.",
      },
      { status: 500 }
    );
  }
}