import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

const AT_API_URL =
  "https://api.accesstrade.vn/v1/transactions";

const REQUEST_TIMEOUT_MS = 30_000;

export async function GET(request: NextRequest) {
  try {
    /*
     * =========================================
     * 1. ADMIN AUTH
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

    try {
      await requireAdmin(accessToken);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "FORBIDDEN";

      if (message === "UNAUTHORIZED") {
        return NextResponse.json(
          {
            success: false,
            error: "UNAUTHORIZED",
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    /*
     * =========================================
     * 2. ENV
     * =========================================
     */

    const apiKey =
      process.env.ACCESSTRADE_API_KEY?.trim();

    if (!apiKey) {
      console.error(
        "ACCESSTRADE_API_KEY is not configured."
      );

      return NextResponse.json(
        {
          success: false,
          error: "SERVER_CONFIGURATION_ERROR",
        },
        { status: 500 }
      );
    }

    /*
     * =========================================
     * 3. QUERY
     * =========================================
     */

    const searchParams =
      request.nextUrl.searchParams;

    const rawDays = Number(
      searchParams.get("days") ?? "30"
    );

    const rawLimit = Number(
      searchParams.get("limit") ?? "100"
    );

    const rawPage = Number(
      searchParams.get("page") ?? "1"
    );

    const days = Number.isFinite(rawDays)
      ? Math.min(
          Math.max(Math.trunc(rawDays), 1),
          90
        )
      : 30;

    const limit = Number.isFinite(rawLimit)
      ? Math.min(
          Math.max(Math.trunc(rawLimit), 1),
          100
        )
      : 100;

    const page = Number.isFinite(rawPage)
      ? Math.max(
          Math.trunc(rawPage),
          1
        )
      : 1;

    /*
     * =========================================
     * 4. DATE RANGE
     * =========================================
     */

    const until = new Date();

    const since = new Date(
      until.getTime() -
        days * 24 * 60 * 60 * 1000
    );

    const params =
      new URLSearchParams({
        since: since.toISOString(),
        until: until.toISOString(),
        page: String(page),
        limit: String(limit),
      });

    /*
     * =========================================
     * 5. ACCESSTRADE REQUEST
     * =========================================
     */

    const controller =
      new AbortController();

    const timeout =
      setTimeout(() => {
        controller.abort();
      }, REQUEST_TIMEOUT_MS);

    let response: Response;

    try {
      response = await fetch(
        `${AT_API_URL}?${params.toString()}`,
        {
          method: "GET",

          headers: {
            Authorization:
              `Token ${apiKey}`,

            Accept:
              "application/json",
          },

          cache: "no-store",

          signal:
            controller.signal,
        }
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "AbortError"
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "ACCESSTRADE_TIMEOUT",
          },
          { status: 504 }
        );
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }

    /*
     * =========================================
     * 6. RESPONSE
     * =========================================
     */

    const text =
      await response.text();

    let data: unknown;

    try {
      data = JSON.parse(text);
    } catch {
      data = {
        raw_response: text,
      };
    }

    if (!response.ok) {
      console.error(
        "ACCESSTRADE transactions request failed:",
        response.status
      );

      return NextResponse.json(
        {
          success: false,
          status: response.status,
          error: "ACCESSTRADE_API_ERROR",
        },
        {
          status:
            response.status >= 400 &&
            response.status <= 599
              ? response.status
              : 502,
        }
      );
    }

    /*
     * =========================================
     * 7. SUCCESS
     * =========================================
     */

    return NextResponse.json({
      success: true,

      query: {
        days,
        limit,
        page,
        since: since.toISOString(),
        until: until.toISOString(),
      },

      data,
    });
  } catch (error) {
    console.error(
      "ACCESSTRADE transactions error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}