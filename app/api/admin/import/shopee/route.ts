import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin";

type ShopeeRow = Record<string, string>;

type OrderStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "paid";

type PreviewOrder = {
  external_order_id: string;
  tracking_id: string | null;
  user_id: string | null;
  status: "pending" | "approved" | "rejected";
  product_name: string;
  order_value: number;
  commission: number;
  cashback: number;
  row_count: number;
  matched: boolean;
  reason: string | null;
  rows: ShopeeRow[];
};

/* =========================================================
   SUPABASE
========================================================= */

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error(
      "Thiếu NEXT_PUBLIC_SUPABASE_URL."
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      "Thiếu SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(
    url,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

/* =========================================================
   ADMIN AUTH
========================================================= */

async function requireAdminFromRequest(
  request: Request
) {
  const authorization =
    request.headers.get("authorization");

  if (
    !authorization ||
    !authorization.startsWith("Bearer ")
  ) {
    throw new Error("UNAUTHORIZED");
  }

  const accessToken =
    authorization
      .slice("Bearer ".length)
      .trim();

  if (!accessToken) {
    throw new Error("UNAUTHORIZED");
  }

  await requireAdmin(accessToken);
}

/* =========================================================
   MONEY
========================================================= */

function parseMoney(value: unknown): number {
  if (value === null || value === undefined) {
    return 0;
  }

  let text = String(value).trim();

  if (!text) {
    return 0;
  }

  const negative =
    text.includes("-") ||
    /^\(.*\)$/.test(text);

  text = text
    .replace(/₫/gi, "")
    .replace(/đ/gi, "")
    .replace(/\s/g, "")
    .replace(/[()]/g, "")
    .trim();

  if (!text) {
    return 0;
  }

  /*
   * Shopee Affiliate CSV thực tế:
   *
   * Giá trị đơn hàng:
   *   57600
   *   173293
   *   260000
   *
   * Hoa hồng:
   *   2400.000
   *   6931.720
   *   3587.465
   *
   * Dấu "." trong trường hợp này là DECIMAL,
   * không phải thousand separator.
   */

  const dotCount =
    (text.match(/\./g) || []).length;

  const commaCount =
    (text.match(/,/g) || []).length;

  let normalized = text;

  /*
   * Có cả "." và ","
   *
   * Ví dụ:
   * 1.234,56 -> 1234.56
   * 1,234.56 -> 1234.56
   */
  if (
    dotCount > 0 &&
    commaCount > 0
  ) {
    if (
      normalized.lastIndexOf(",") >
      normalized.lastIndexOf(".")
    ) {
      normalized = normalized
        .replace(/\./g, "")
        .replace(",", ".");
    } else {
      normalized = normalized.replace(
        /,/g,
        ""
      );
    }
  }

  /*
   * Có nhiều dấu "."
   *
   * Ví dụ:
   * 1.250.000 -> 1250000
   *
   * Đây mới là trường hợp
   * "." là thousand separator.
   */
  else if (dotCount > 1) {
    normalized =
      normalized.replace(/\./g, "");
  }

  /*
   * Chỉ có một "."
   *
   * QUAN TRỌNG:
   *
   * 6931.720 phải giữ nguyên
   * thành 6931.720
   *
   * Không được biến thành 6931720.
   */
  else if (
    dotCount === 1 &&
    commaCount === 0
  ) {
    // giữ nguyên
  }

  /*
   * Chỉ có một ","
   */
  else if (
    commaCount === 1 &&
    dotCount === 0
  ) {
    const parts =
      normalized.split(",");

    const decimalPart =
      parts[1] ?? "";

    /*
     * 1,250,000 không rơi vào đây
     * vì có nhiều comma.
     *
     * 6479,46 -> 6479.46
     */
    if (
      decimalPart.length === 1 ||
      decimalPart.length === 2
    ) {
      normalized =
        normalized.replace(",", ".");
    } else {
      normalized =
        normalized.replace(",", "");
    }
  }

  normalized =
    normalized.replace(
      /[^0-9.]/g,
      ""
    );

  const number =
    Number(normalized);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return negative
    ? -number
    : number;
}

/* =========================================================
   CSV PARSER
========================================================= */

function parseCsv(
  csv: string
): ShopeeRow[] {
  const text = csv.replace(
    /^\uFEFF/,
    ""
  );

  const rows: string[][] = [];

  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (
    let i = 0;
    i < text.length;
    i++
  ) {
    const char = text[i];
    const next = text[i + 1];

    /*
      CSV escaped quote:
      ""
    */
    if (
      char === '"' &&
      inQuotes &&
      next === '"'
    ) {
      currentField += '"';
      i++;
      continue;
    }

    /*
      Quote mở / đóng
    */
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    /*
      Comma giữa các column
    */
    if (
      char === "," &&
      !inQuotes
    ) {
      currentRow.push(
        currentField
      );

      currentField = "";

      continue;
    }

    /*
      Xuống dòng
    */
    if (
      char === "\n" &&
      !inQuotes
    ) {
      currentRow.push(
        currentField
      );

      rows.push(currentRow);

      currentRow = [];
      currentField = "";

      continue;
    }

    if (char !== "\r") {
      currentField += char;
    }
  }

  /*
    Dòng cuối
  */
  if (
    currentField.length > 0 ||
    currentRow.length > 0
  ) {
    currentRow.push(
      currentField
    );

    rows.push(currentRow);
  }

  if (rows.length < 2) {
    return [];
  }

  const headers =
    rows[0].map((header) =>
      header
        .trim()
        .replace(/^\uFEFF/, "")
    );

  return rows
    .slice(1)
    .filter((row) =>
      row.some(
        (value) =>
          String(
            value ?? ""
          ).trim() !== ""
      )
    )
    .map((row) => {
      const result: ShopeeRow = {};

      headers.forEach(
        (header, index) => {
          if (!header) {
            return;
          }

          result[header] =
            String(
              row[index] ?? ""
            ).trim();
        }
      );

      return result;
    });
}

/* =========================================================
   READ CSV FILE
========================================================= */

async function readCsv(
  request: Request
): Promise<ShopeeRow[]> {
  const formData =
    await request.formData();

  const file =
    formData.get("file");

  if (!(file instanceof File)) {
    throw new Error(
      "Vui lòng chọn file CSV."
    );
  }

  if (
    !file.name
      .toLowerCase()
      .endsWith(".csv")
  ) {
    throw new Error(
      "Chỉ hỗ trợ file CSV."
    );
  }

  const csv =
    await file.text();

  if (!csv.trim()) {
    throw new Error(
      "File CSV đang trống."
    );
  }

  return parseCsv(csv);
}

/* =========================================================
   TRACKING
========================================================= */

/*
  Shopee của project dùng:

  sub_id=trackingId

  Sau redirect Shopee có thể thể hiện
  tracking ở dạng:

  utm_content=trackingId

  Report có thể có tên column khác nhau.
*/
function getTrackingIds(
  row: ShopeeRow
): string[] {
  const candidates = [
  row["Sub_id1"],
  row["Sub_id2"],
  row["Sub_id3"],
  row["Sub_id4"],
  row["Sub_id5"],
  row["Sub_id"],
  row["Sub ID"],
  row["SubID"],
  row["sub_id1"],
  row["sub_id2"],
  row["sub_id3"],
  row["sub_id4"],
  row["sub_id5"],
  row["sub_id"],
  row["UTM Content"],
  row["UTM content"],
  row["utm_content"],
];

  return Array.from(
    new Set(
      candidates
        .map((value) =>
          String(
            value ?? ""
          ).trim()
        )
        .filter(Boolean)
        .filter(
          (value) =>
            value !== "-" &&
            value !== "--" &&
            value !== "----" &&
            value !== "(not set)"
        )
    )
  );
}

/* =========================================================
   LOAD SHOPEE TRACKING MAP
========================================================= */

/*
  QUAN TRỌNG:

  Không truyền Supabase client vào đây.

  Hàm tự tạo client để tránh lỗi type
  SupabaseClient generic.
*/
async function getTrackingMap() {
  const supabase =
    getSupabase();

  const {
    data,
    error,
  } = await supabase
    .from("affiliate_links")
    .select(
      "tracking_id,user_id,platform"
    )
    .eq(
      "platform",
      "shopee"
    );

  if (error) {
    throw new Error(
      `Không lấy được affiliate links: ${error.message}`
    );
  }

  const map = new Map<
    string,
    {
      user_id: string;
      tracking_id: string;
    }
  >();

  for (const row of data ?? []) {
    if (
      !row.tracking_id ||
      !row.user_id
    ) {
      continue;
    }

    const trackingId =
      String(
        row.tracking_id
      ).trim();

    if (!trackingId) {
      continue;
    }

    map.set(
      trackingId,
      {
        user_id:
          String(
            row.user_id
          ),
        tracking_id:
          trackingId,
      }
    );
  }

  return map;
}

/* =========================================================
   STATUS
========================================================= */

function normalizeStatus(
  value: unknown
): string {
  return String(
    value ?? ""
  )
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function getOrderStatus(
  rows: ShopeeRow[]
):
  | "pending"
  | "approved"
  | "rejected" {
  const statuses =
    rows
      .map((row) =>
        normalizeStatus(
          row[
            "Trạng thái đặt hàng"
          ]
        )
      )
      .filter(Boolean);

  if (
    statuses.length === 0
  ) {
    return "pending";
  }

  /*
    Tất cả item bị hủy
    => order rejected
  */
  const allRejected =
    statuses.every(
      (status) =>
        status === "đã hủy" ||
        status === "đã huỷ" ||
        status === "hủy" ||
        status === "huỷ"
    );

  if (allRejected) {
    return "rejected";
  }

  /*
    Có ít nhất một item
    hoàn thành
    => approved
  */
  const hasCompleted =
    statuses.some(
      (status) =>
        status === "hoàn thành" ||
        status ===
          "đã hoàn thành"
    );

  if (hasCompleted) {
    return "approved";
  }

  return "pending";
}

/* =========================================================
   CASHBACK RATE
========================================================= */

function getCashbackRate(): number {
  const value = Number(
    process.env.SHOPEE_CASHBACK_RATE ??
      "0.6"
  );

  if (
    !Number.isFinite(value)
  ) {
    return 0.6;
  }

  return Math.max(
    0,
    Math.min(1, value)
  );
}

/* =========================================================
   BUILD PREVIEW
========================================================= */

function buildPreview(
  rows: ShopeeRow[],
  trackingMap: Map<
    string,
    {
      user_id: string;
      tracking_id: string;
    }
  >
): PreviewOrder[] {
  /*
    Group theo ID đơn hàng.

    Một order Shopee có thể có
    nhiều dòng item.
  */
  const grouped =
    new Map<
      string,
      ShopeeRow[]
    >();

  for (const row of rows) {
    const orderId =
      String(
        row[
          "ID đơn hàng"
        ] ?? ""
      ).trim();

    if (!orderId) {
      continue;
    }

    const existing =
      grouped.get(
        orderId
      ) ?? [];

    existing.push(row);

    grouped.set(
      orderId,
      existing
    );
  }

  const cashbackRate =
    getCashbackRate();

  return Array.from(
    grouped.entries()
  ).map(
    ([
      externalOrderId,
      orderRows,
    ]) => {
      /*
        Tìm tất cả tracking
        trong các row.
      */
      const trackingValues =
        Array.from(
          new Set(
            orderRows.flatMap(
              (row) =>
                getTrackingIds(
                  row
                )
            )
          )
        );

      /*
        Tìm tracking thực sự
        tồn tại trong DB.
      */
      const matchedTracking =
        trackingValues.find(
          (trackingId) =>
            trackingMap.has(
              trackingId
            )
        ) ?? null;

      const trackingId =
        matchedTracking ??
        trackingValues[0] ??
        null;

      const matchedUser =
        matchedTracking
          ? trackingMap.get(
              matchedTracking
            ) ?? null
          : null;

      /*
        Product names
      */
      const productNames =
        Array.from(
          new Set(
            orderRows
              .map(
                (row) =>
                  String(
                    row[
                      "Tên Item"
                    ] ?? ""
                  ).trim()
              )
              .filter(Boolean)
          )
        );

      /*
        Giá trị order.

        File Shopee thực tế của bạn:
        mỗi item có giá trị riêng,
        nên cộng các dòng trong
        cùng ID đơn hàng là phù hợp.
      */
      const orderValue =
        orderRows.reduce(
          (total, row) =>
            total +
            parseMoney(
              row[
                "Giá trị đơn hàng (₫)"
              ]
            ),
          0
        );

      /*
        Dùng hoa hồng ròng
        tiếp thị liên kết.
      */
      const commission =
        orderRows.reduce(
          (total, row) =>
            total +
            parseMoney(
              row[
                "Hoa hồng ròng tiếp thị liên kết(₫)"
              ]
            ),
          0
        );

      const status =
        getOrderStatus(
          orderRows
        );

      const cashback =
        status === "rejected"
          ? 0
          : Math.round(
              commission *
                cashbackRate
            );

      let reason:
        | string
        | null = null;

      if (
        trackingValues.length ===
        0
      ) {
        reason =
          "MISSING_TRACKING";
      } else if (
        !matchedUser
      ) {
        reason =
          "TRACKING_NOT_FOUND";
      }

      return {
        external_order_id:
          externalOrderId,

        tracking_id:
          matchedTracking,

        user_id:
          matchedUser?.user_id ??
          null,

        status,

        product_name:
          productNames.length > 0
            ? productNames.join(
                " + "
              )
            : "Shopee order",

        order_value:
          orderValue,

        commission,

        cashback,

        row_count:
          orderRows.length,

        matched:
          Boolean(
            matchedUser
          ),

        reason,

        rows: orderRows,
      };
    }
  );
}

/* =========================================================
   POST = PREVIEW
========================================================= */

export async function POST(
  request: Request
) {
  try {
    await requireAdminFromRequest(
      request
    );

    const rows =
      await readCsv(
        request
      );

    if (
      rows.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "CSV không có dữ liệu.",
        },
        {
          status: 400,
        }
      );
    }

    const trackingMap =
      await getTrackingMap();

    const orders =
      buildPreview(
        rows,
        trackingMap
      );

    const matched =
      orders.filter(
        (order) =>
          order.matched
      );

    const unmatched =
      orders.filter(
        (order) =>
          !order.matched
      );

    return NextResponse.json({
      success: true,

      summary: {
        csv_rows:
          rows.length,

        orders:
          orders.length,

        matched:
          matched.length,

        unmatched:
          unmatched.length,

        total_order_value:
          orders.reduce(
            (sum, order) =>
              sum +
              order.order_value,
            0
          ),

        total_commission:
          orders.reduce(
            (sum, order) =>
              sum +
              order.commission,
            0
          ),

        total_cashback:
          matched.reduce(
            (sum, order) =>
              sum +
              order.cashback,
            0
          ),

        cashback_rate:
          getCashbackRate(),
      },

      orders,
    });
  } catch (error) {
    console.error(
      "Shopee preview error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Không thể preview CSV.";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status:
          message ===
          "UNAUTHORIZED"
            ? 401
            : 500,
      }
    );
  }
}

/* =========================================================
   PUT = IMPORT
========================================================= */

export async function PUT(
  request: Request
) {
  try {
    await requireAdminFromRequest(
      request
    );

    const supabase =
      getSupabase();

    const rows =
      await readCsv(
        request
      );

    if (
      rows.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "CSV không có dữ liệu.",
        },
        {
          status: 400,
        }
      );
    }

    const trackingMap =
      await getTrackingMap();

    const preview =
      buildPreview(
        rows,
        trackingMap
      );

    let imported = 0;
    let skipped = 0;
    let walletCredited = 0;
    let alreadyCredited = 0;

    const errors: Array<{
      external_order_id: string;
      error: string;
    }> = [];

    for (
      const item of preview
    ) {
      if (
        !item.matched ||
        !item.user_id ||
        !item.tracking_id
      ) {
        skipped++;
        continue;
      }

      const {
        data: existingOrder,
        error:
          existingOrderError,
      } = await supabase
        .from("orders")
        .select(
          `
            id,
            user_id,
            status,
            cashback,
            approved_at,
            paid_at
          `
        )
        .eq(
          "platform",
          "shopee"
        )
        .eq(
          "external_order_id",
          item.external_order_id
        )
        .maybeSingle();

      if (
        existingOrderError
      ) {
        errors.push({
          external_order_id:
            item.external_order_id,
          error:
            existingOrderError.message,
        });
        continue;
      }

      if (
        existingOrder &&
        existingOrder.user_id !==
          item.user_id
      ) {
        errors.push({
          external_order_id:
            item.external_order_id,
          error:
            "ORDER_USER_MISMATCH",
        });
        continue;
      }

      /*
       * QUAN TRỌNG:
       * Không ghi incoming status vào order hiện có trước khi gọi RPC.
       * RPC cần đọc status cũ để quyết định transition và wallet.
       *
       * Với order mới, tạo trước ở pending để RPC xử lý incoming status.
       */
      const storedStatus: OrderStatus =
        existingOrder?.status ??
        "pending";

      let finalCashback =
        item.cashback;

      if (
        existingOrder &&
        Number(
          existingOrder.cashback ?? 0
        ) > 0
      ) {
        finalCashback =
          Number(
            existingOrder.cashback
          );
      }

      const firstRow =
        item.rows[0];

      const orderedAt =
        firstRow[
          "Thời Gian Đặt Hàng"
        ] || null;

      const completedAt =
        firstRow[
          "Thời gian hoàn thành"
        ] || null;

      const approvedAt =
        storedStatus === "approved" ||
        storedStatus === "paid"
          ? existingOrder?.approved_at ??
            completedAt ??
            orderedAt ??
            null
          : existingOrder?.approved_at ??
            null;

      const paidAt =
        existingOrder?.paid_at ??
        null;

      const {
        data: order,
        error: orderError,
      } = await supabase
        .from("orders")
        .upsert(
          {
            user_id:
              existingOrder?.user_id ??
              item.user_id,

            platform:
              "shopee",

            external_order_id:
              item.external_order_id,

            tracking_id:
              item.tracking_id,

            product_name:
              item.product_name,

            order_value:
              item.order_value,

            commission:
              item.commission,

            cashback:
              finalCashback,

            // Giữ status cũ. RPC sẽ áp incoming status.
            status:
              storedStatus,

            ordered_at:
              orderedAt,

            approved_at:
              approvedAt,

            paid_at:
              paidAt,

            imported_at:
              new Date().toISOString(),

            raw_data: {
              source:
                "shopee_commission_report",

              incoming_status:
                item.status,

              tracking_candidates:
                Array.from(
                  new Set(
                    item.rows.flatMap(
                      (row) =>
                        getTrackingIds(
                          row
                        )
                    )
                  )
                ),

              rows:
                item.rows,
            },
          },
          {
            onConflict:
              "platform,external_order_id",
          }
        )
        .select("id")
        .single();

      if (
        orderError ||
        !order
      ) {
        errors.push({
          external_order_id:
            item.external_order_id,
          error:
            orderError?.message ??
            "Không tạo được order.",
        });
        continue;
      }

      /*
       * Đọc ledger trước RPC chỉ để thống kê response cho Admin UI.
       * Việc cộng/trừ tiền thực tế hoàn toàn nằm trong RPC transaction.
       */
      const {
        data: ledgerBefore,
        error: ledgerBeforeError,
      } = await supabase
        .from("wallet_ledger")
        .select("type")
        .eq("order_id", order.id)
        .in(
          "type",
          [
            "cashback",
            "cashback_reversal",
          ]
        );

      if (ledgerBeforeError) {
        errors.push({
          external_order_id:
            item.external_order_id,
          error:
            `Không kiểm tra được wallet trước RPC: ${ledgerBeforeError.message}`,
        });
        continue;
      }

      const hadCashback =
        (ledgerBefore ?? []).some(
          (row) =>
            row.type === "cashback"
        );

      const hadReversal =
        (ledgerBefore ?? []).some(
          (row) =>
            row.type ===
            "cashback_reversal"
        );

      const {
        data: rpcResult,
        error: rpcError,
      } = await supabase.rpc(
        "apply_order_cashback",
        {
          p_order_id:
            order.id,
          p_status:
            item.status,
          p_cashback:
            finalCashback,
        }
      );

      if (rpcError) {
        errors.push({
          external_order_id:
            item.external_order_id,
          error:
            `Không đồng bộ cashback: ${rpcError.message}`,
        });
        continue;
      }

      imported++;

      const rpcData =
        rpcResult &&
        typeof rpcResult === "object" &&
        !Array.isArray(rpcResult)
          ? (rpcResult as {
              status?: string;
              cashback?: number;
              reversal?: number;
            })
          : null;

      const rpcStatus =
        String(
          rpcData?.status ?? ""
        );

      if (
        !hadCashback &&
        !hadReversal &&
        (rpcStatus === "approved" ||
          rpcStatus === "paid") &&
        finalCashback > 0
      ) {
        walletCredited++;
      } else if (
        hadCashback ||
        hadReversal
      ) {
        alreadyCredited++;
      }
    }

    return NextResponse.json({
      success: true,

      summary: {
        csv_rows:
          rows.length,

        orders:
          preview.length,

        imported,

        skipped,

        wallet_credited:
          walletCredited,

        already_credited:
          alreadyCredited,

        errors:
          errors.length,
      },

      errors,
    });
  } catch (error) {
    console.error(
      "Shopee import error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Không thể import Shopee CSV.";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status:
          message ===
          "UNAUTHORIZED"
            ? 401
            : 500,
      }
    );
  }
}
