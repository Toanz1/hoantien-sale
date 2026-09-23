import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authorization =
      request.headers.get("authorization");

    const token =
      authorization?.startsWith("Bearer ")
        ? authorization.slice(7).trim()
        : "";

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          isAdmin: false,
          error: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    const user = await requireAdmin(token);

    return NextResponse.json({
      success: true,
      isAdmin: true,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "UNKNOWN_ERROR";

    if (message === "UNAUTHORIZED") {
      return NextResponse.json(
        {
          success: false,
          isAdmin: false,
          error: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    if (message === "FORBIDDEN") {
      return NextResponse.json(
        {
          success: false,
          isAdmin: false,
          error: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    console.error("GET /api/admin/me:", error);

    return NextResponse.json(
      {
        success: false,
        isAdmin: false,
        error: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}