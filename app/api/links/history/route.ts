import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getUserClient(authHeader: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("SERVER_CONFIGURATION_ERROR");
  }

  return createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      return NextResponse.json(
        { error: "Bạn cần đăng nhập để xem lịch sử link." },
        { status: 401 }
      );
    }

    const supabase = getUserClient(authHeader);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Phiên đăng nhập không hợp lệ." },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("affiliate_links")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("affiliate_links history error:", error);

      return NextResponse.json(
        {
          error: "Không thể tải lịch sử link.",
          detail: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      links: data ?? [],
    });
  } catch (error) {
    console.error("GET /api/links/history error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Có lỗi xảy ra trên server.",
      },
      { status: 500 }
    );
  }
}
