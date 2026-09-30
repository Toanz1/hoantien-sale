import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const DEFAULT_FEATURED_PRODUCTS = [
  {
    id: "prod-shopee-1",
    name: "Tai nghe Bluetooth 5.3 không dây True Wireless âm thanh Hifi chống ồn ANC",
    platform: "shopee",
    product_url: "https://shopee.vn",
    image_url: "https://picsum.photos/seed/earphones/400/400",
    price: 350000,
    original_price: 590000,
    cashback_percent: 12,
    sort_order: 1,
  },
  {
    id: "prod-lazada-1",
    name: "Nồi chiên không dầu điện tử 6.5L lòng chống dính cao cấp công nghệ đối lưu 360",
    platform: "lazada",
    product_url: "https://www.lazada.vn",
    image_url: "https://picsum.photos/seed/airfryer/400/400",
    price: 890000,
    original_price: 1590000,
    cashback_percent: 10,
    sort_order: 2,
  },
  {
    id: "prod-tiktok-1",
    name: "Bàn chải đánh răng điện siêu âm thông minh Sonic IPX7 tặng kèm 4 đầu chải",
    platform: "tiktok",
    product_url: "https://www.tiktok.com",
    image_url: "https://picsum.photos/seed/toothbrush/400/400",
    price: 280000,
    original_price: 450000,
    cashback_percent: 15,
    sort_order: 3,
  },
  {
    id: "prod-shopee-2",
    name: "Pin sạc dự phòng 20.000mAh hỗ trợ sạc nhanh 22.5W màn hình LED hiển thị % pin",
    platform: "shopee",
    product_url: "https://shopee.vn",
    image_url: "https://picsum.photos/seed/powerbank/400/400",
    price: 420000,
    original_price: 650000,
    cashback_percent: 8,
    sort_order: 4,
  },
  {
    id: "prod-lazada-2",
    name: "Máy xay sinh tố cầm tay mini 6 lưỡi dao thép sạc USB tiện lợi khi du lịch",
    platform: "lazada",
    product_url: "https://www.lazada.vn",
    image_url: "https://picsum.photos/seed/blender/400/400",
    price: 199000,
    original_price: 350000,
    cashback_percent: 14,
    sort_order: 5,
  },
  {
    id: "prod-tiktok-2",
    name: "Đèn bàn học LED chống cận thị bảo vệ mắt 3 chế độ sáng cảm ứng điều chỉnh",
    platform: "tiktok",
    product_url: "https://www.tiktok.com",
    image_url: "https://picsum.photos/seed/lamp/400/400",
    price: 165000,
    original_price: 280000,
    cashback_percent: 18,
    sort_order: 6,
  },
];

function getServerClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder";

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        success: true,
        products: DEFAULT_FEATURED_PRODUCTS,
      });
    }

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
      console.warn(
        "Load featured products from database returned error, using fallback products:",
        error.message
      );

      return NextResponse.json({
        success: true,
        products: DEFAULT_FEATURED_PRODUCTS,
      });
    }

    const products = data && data.length > 0 ? data : DEFAULT_FEATURED_PRODUCTS;

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error) {
    console.warn("Featured products fallback active:", error);

    return NextResponse.json({
      success: true,
      products: DEFAULT_FEATURED_PRODUCTS,
    });
  }
}
