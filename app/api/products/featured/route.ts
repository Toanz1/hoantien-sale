import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getServerClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "SERVER_CONFIGURATION_ERROR"
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

export async function GET() {
  try {
    const supabase = getServerClient();

    const { data, error } = await supabase
      .from("featured_products")
      .select(`
        id,
        name,
        platform,
        product_url,
        image_url,
        price,
        original_price,
        cashback_percent,
        sort_order
      `)
      .eq("is_active", true)
      .order("sort_order", {
        ascending: true,
      })
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Load featured products error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Không thể tải sản phẩm nổi bật.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      products: data ?? [],
    });
  } catch (error) {
    console.error(
      "Featured products API error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "";

    if (
      message ===
      "SERVER_CONFIGURATION_ERROR"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Server chưa được cấu hình đầy đủ.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "Có lỗi xảy ra trên server.",
      },
      { status: 500 }
    );
  }
}