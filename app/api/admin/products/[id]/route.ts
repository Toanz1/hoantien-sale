import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { requireAdmin } from "@/lib/admin";

type Platform = "shopee" | "lazada" | "tiktok";

type ProductBody = {
  name?: string;
  platform?: Platform;
  product_url?: string;
  image_url?: string | null;
  price?: number | string | null;
  original_price?: number | string | null;
  cashback_percent?: number | string | null;
  is_active?: boolean;
  sort_order?: number | string;
};

function getAccessToken(request: NextRequest) {
  const authorization =
    request.headers.get("authorization") ?? "";

  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return authorization.slice(7).trim();
}

function getAdminClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SERVER_CONFIGURATION_ERROR");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function optionalNumber(
  value: number | string | null | undefined
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    throw new Error("INVALID_NUMBER");
  }

  return number;
}

function normalizeProduct(body: ProductBody) {
  const name = body.name?.trim() ?? "";

  const platform =
    body.platform?.trim().toLowerCase() ?? "";

  const productUrl =
    body.product_url?.trim() ?? "";

  const imageUrl =
    body.image_url?.trim() || null;

  if (!name) {
    throw new Error("NAME_REQUIRED");
  }

  if (
    !["shopee", "lazada", "tiktok"].includes(platform)
  ) {
    throw new Error("INVALID_PLATFORM");
  }

  if (!productUrl) {
    throw new Error("PRODUCT_URL_REQUIRED");
  }

  try {
    const parsedUrl = new URL(productUrl);

    if (
      !["http:", "https:"].includes(parsedUrl.protocol)
    ) {
      throw new Error();
    }
  } catch {
    throw new Error("INVALID_PRODUCT_URL");
  }

  if (imageUrl) {
    try {
      const parsedImage = new URL(imageUrl);

      if (
        !["http:", "https:"].includes(
          parsedImage.protocol
        )
      ) {
        throw new Error();
      }
    } catch {
      throw new Error("INVALID_IMAGE_URL");
    }
  }

  const price = optionalNumber(body.price);

  const originalPrice = optionalNumber(
    body.original_price
  );

  const cashbackPercent = optionalNumber(
    body.cashback_percent
  );

  if (
    cashbackPercent !== null &&
    cashbackPercent > 100
  ) {
    throw new Error("INVALID_CASHBACK_PERCENT");
  }

  const sortOrder =
    body.sort_order === "" ||
    body.sort_order === undefined ||
    body.sort_order === null
      ? 0
      : Number(body.sort_order);

  if (
    !Number.isInteger(sortOrder) ||
    sortOrder < 0
  ) {
    throw new Error("INVALID_SORT_ORDER");
  }

  return {
    name,
    platform,
    product_url: productUrl,
    image_url: imageUrl,
    price,
    original_price: originalPrice,
    cashback_percent: cashbackPercent,

    is_active:
      typeof body.is_active === "boolean"
        ? body.is_active
        : true,

    sort_order: sortOrder,

    updated_at: new Date().toISOString(),
  };
}

function validationError(error: unknown) {
  if (!(error instanceof Error)) {
    return null;
  }

  const messages: Record<string, string> = {
    NAME_REQUIRED:
      "Vui lòng nhập tên sản phẩm.",

    INVALID_PLATFORM:
      "Sàn không hợp lệ.",

    PRODUCT_URL_REQUIRED:
      "Vui lòng nhập link sản phẩm.",

    INVALID_PRODUCT_URL:
      "Link sản phẩm không hợp lệ.",

    INVALID_IMAGE_URL:
      "URL ảnh không hợp lệ.",

    INVALID_NUMBER:
      "Giá hoặc phần trăm hoàn tiền không hợp lệ.",

    INVALID_CASHBACK_PERCENT:
      "Phần trăm hoàn tiền phải từ 0 đến 100%.",

    INVALID_SORT_ORDER:
      "Thứ tự hiển thị phải là số nguyên từ 0 trở lên.",
  };

  return messages[error.message] ?? null;
}

function errorResponse(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : "UNKNOWN_ERROR";

  if (message === "UNAUTHORIZED") {
    return NextResponse.json(
      {
        success: false,
        error: "Bạn chưa đăng nhập.",
      },
      { status: 401 }
    );
  }

  if (message === "FORBIDDEN") {
    return NextResponse.json(
      {
        success: false,
        error: "Bạn không có quyền quản trị.",
      },
      { status: 403 }
    );
  }

  if (message === "SERVER_CONFIGURATION_ERROR") {
    return NextResponse.json(
      {
        success: false,
        error: "Server chưa được cấu hình đầy đủ.",
      },
      { status: 500 }
    );
  }

  console.error(
    "Admin product detail API error:",
    error
  );

  return NextResponse.json(
    {
      success: false,
      error: "Có lỗi xảy ra trên server.",
    },
    { status: 500 }
  );
}

/* =========================
   UPDATE PRODUCT
========================= */

export async function PUT(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const accessToken = getAccessToken(request);

    await requireAdmin(accessToken);

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu ID sản phẩm.",
        },
        { status: 400 }
      );
    }

    let body: ProductBody;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Dữ liệu gửi lên không hợp lệ.",
        },
        { status: 400 }
      );
    }

    let product;

    try {
      product = normalizeProduct(body);
    } catch (error) {
      const message = validationError(error);

      if (message) {
        return NextResponse.json(
          {
            success: false,
            error: message,
          },
          { status: 400 }
        );
      }

      throw error;
    }

    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("featured_products")
      .update(product)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      console.error(
        "Update featured product error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error: "Không thể cập nhật sản phẩm.",
        },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: "Không tìm thấy sản phẩm.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product: data,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

/* =========================
   DELETE PRODUCT
========================= */

export async function DELETE(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const accessToken = getAccessToken(request);

    await requireAdmin(accessToken);

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu ID sản phẩm.",
        },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("featured_products")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error(
        "Delete featured product error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error: "Không thể xóa sản phẩm.",
        },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: "Không tìm thấy sản phẩm.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return errorResponse(error);
  }
}