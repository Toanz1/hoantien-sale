import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import { requireAdmin } from "@/lib/admin";

type LazadaRow = Record<string, string>;
type OrderStatus = "pending" | "approved" | "rejected" | "paid";

type PreviewOrder = {
  external_order_id: string;
  tracking_id: string | null;
  user_id: string | null;
  status: "pending" | "approved" | "rejected";
  source_status: string;
  product_name: string;
  order_value: number;
  commission: number;
  cashback: number;
  row_count: number;
  matched: boolean;
  reason: string | null;
  rows: LazadaRow[];
};

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("Thiếu NEXT_PUBLIC_SUPABASE_URL.");
  if (!serviceRoleKey) throw new Error("Thiếu SUPABASE_SERVICE_ROLE_KEY.");
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function requireAdminFromRequest(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
  const accessToken = authorization.slice("Bearer ".length).trim();
  if (!accessToken) throw new Error("UNAUTHORIZED");
  await requireAdmin(accessToken);
}

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function parseMoney(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  let text = clean(value).replace(/₫|vnd/gi, "").replace(/\s/g, "");
  if (!text) return 0;
  const negative = text.startsWith("-") || /^\(.*\)$/.test(text);
  text = text.replace(/[()]/g, "").replace(/^-/, "");
  const lastComma = text.lastIndexOf(",");
  const lastDot = text.lastIndexOf(".");
  if (lastComma >= 0 && lastDot >= 0) {
    if (lastComma > lastDot) text = text.replace(/\./g, "").replace(",", ".");
    else text = text.replace(/,/g, "");
  } else if (lastComma >= 0) {
    const decimals = text.length - lastComma - 1;
    text = decimals === 3 && /^\d{1,3}(,\d{3})+$/.test(text)
      ? text.replace(/,/g, "")
      : text.replace(",", ".");
  }
  const number = Number(text);
  if (!Number.isFinite(number)) return 0;
  return negative ? -number : number;
}

function normalizeDate(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  const text = clean(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function readWorkbook(request: Request): Promise<LazadaRow[]> {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("Vui lòng chọn file Lazada .xlsx, .xls hoặc .csv.");
  const lower = file.name.toLowerCase();
  if (!lower.endsWith(".xlsx") && !lower.endsWith(".xls") && !lower.endsWith(".csv")) {
    throw new Error("Chỉ hỗ trợ file .xlsx, .xls hoặc .csv.");
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames.includes("Lazada Report")
    ? "Lazada Report"
    : workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });
  return raw.map((row) => {
    const result: LazadaRow = {};
    for (const [key, value] of Object.entries(row)) result[clean(key)] = clean(value);
    return result;
  });
}

function getTrackingIds(row: LazadaRow): string[] {
  // Link Lazada của project gửi tracking bằng sub_id1.
  // Các cột còn lại chỉ là fallback để chịu được biến thể report.
  const candidates = [
    row["Sub ID 1"], row["Aff Sub ID"], row["Sub ID 2"], row["Sub ID 3"],
    row["Sub ID 4"], row["Sub ID 5"], row["Sub ID 6"],
    row["sub_id1"], row["sub id 1"], row["aff sub id"],
  ];
  return Array.from(new Set(candidates.map(clean).filter((v) => v && v !== "-" && v !== "(not set)")));
}

async function getTrackingMap() {
  const { data, error } = await getSupabase()
    .from("affiliate_links")
    .select("tracking_id,user_id,platform")
    .eq("platform", "lazada");
  if (error) throw new Error(`Không lấy được Lazada affiliate links: ${error.message}`);
  const map = new Map<string, { user_id: string; tracking_id: string }>();
  for (const row of data ?? []) {
    const trackingId = clean(row.tracking_id);
    const userId = clean(row.user_id);
    if (trackingId && userId) map.set(trackingId, { user_id: userId, tracking_id: trackingId });
  }
  return map;
}

function normalizeStatus(value: unknown) {
  return clean(value).toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function statusFromRow(row: LazadaRow): "pending" | "approved" | "rejected" {
  // File người dùng cung cấp hiện chưa có order, nên chưa có giá trị Status thật để xác nhận.
  // Mapping này cố ý bảo thủ: chỉ các từ khóa rõ ràng mới approve/reject; còn lại giữ pending.
  const values = [row["Status"], row["Validity"], row["Payment Status"]]
    .map(normalizeStatus)
    .filter(Boolean);
  const joined = values.join(" | ");

  const rejectedWords = [
    "rejected", "invalid", "cancelled", "canceled", "returned", "refunded",
    "declined", "not valid", "đã hủy", "đã huỷ", "hủy", "huỷ", "không hợp lệ",
  ];
  if (rejectedWords.some((word) => joined.includes(word))) return "rejected";

  const approvedWords = [
    "approved", "valid", "confirmed", "completed", "fulfilled", "delivered",
    "paid", "đã duyệt", "hợp lệ", "hoàn thành", "đã giao",
  ];
  if (approvedWords.some((word) => joined.includes(word))) return "approved";

  return "pending";
}

function getOrderStatus(rows: LazadaRow[]) {
  const statuses = rows.map(statusFromRow);
  if (statuses.length > 0 && statuses.every((s) => s === "rejected")) return "rejected" as const;
  if (statuses.some((s) => s === "approved")) return "approved" as const;
  return "pending" as const;
}

function getCashbackRate() {
  const value = Number(process.env.LAZADA_CASHBACK_RATE ?? "0.7");
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0.7;
}

function getExternalOrderId(row: LazadaRow) {
  // Ưu tiên Sub Order ID vì đây là định danh chi tiết nhất có trong Conversion Report.
  return clean(row["Sub Order ID"] || row["Sku Order ID"] || row["Check Out ID"]);
}

function buildPreview(
  rows: LazadaRow[],
  trackingMap: Map<string, { user_id: string; tracking_id: string }>
): PreviewOrder[] {
  const grouped = new Map<string, LazadaRow[]>();
  for (const row of rows) {
    const id = getExternalOrderId(row);
    if (!id) continue;
    grouped.set(id, [...(grouped.get(id) ?? []), row]);
  }
  const rate = getCashbackRate();
  return Array.from(grouped.entries()).map(([externalOrderId, orderRows]) => {
    const trackingValues = Array.from(new Set(orderRows.flatMap(getTrackingIds)));
    const matchedTracking = trackingValues.find((id) => trackingMap.has(id)) ?? null;
    const matchedUser = matchedTracking ? trackingMap.get(matchedTracking) ?? null : null;
    const productNames = Array.from(new Set(orderRows.map((r) => clean(r["Product Name"] || r["SKU Name"])).filter(Boolean)));
    const orderValue = orderRows.reduce((sum, row) => sum + parseMoney(row["Order Amount"]), 0);
    // Payout là cột hoa hồng có sẵn trong Conversion Report. Adjustment được lưu trong raw_data,
    // chưa tự cộng vào commission cho đến khi có row Lazada thật để xác nhận semantics.
    const commission = orderRows.reduce((sum, row) => sum + parseMoney(row["Payout"]), 0);
    const status = getOrderStatus(orderRows);
    const cashback = status === "rejected" ? 0 : Math.round(commission * rate);
    const sourceStatus = Array.from(new Set(orderRows.map((r) => clean(r["Status"] || r["Validity"])).filter(Boolean))).join(" + ");
    let reason: string | null = null;
    if (!trackingValues.length) reason = "MISSING_TRACKING";
    else if (!matchedUser) reason = "TRACKING_NOT_FOUND";
    return {
      external_order_id: externalOrderId,
      tracking_id: matchedTracking,
      user_id: matchedUser?.user_id ?? null,
      status,
      source_status: sourceStatus,
      product_name: productNames.join(" + ") || "Lazada order",
      order_value: orderValue,
      commission,
      cashback,
      row_count: orderRows.length,
      matched: Boolean(matchedUser),
      reason,
      rows: orderRows,
    };
  });
}

export async function POST(request: Request) {
  try {
    await requireAdminFromRequest(request);
    const rows = await readWorkbook(request);
    if (!rows.length) return NextResponse.json({ success: false, error: "File Lazada không có dữ liệu order." }, { status: 400 });
    const orders = buildPreview(rows, await getTrackingMap());
    const matched = orders.filter((o) => o.matched);
    return NextResponse.json({
      success: true,
      summary: {
        rows: rows.length,
        orders: orders.length,
        matched: matched.length,
        unmatched: orders.length - matched.length,
        total_order_value: orders.reduce((s, o) => s + o.order_value, 0),
        total_commission: orders.reduce((s, o) => s + o.commission, 0),
        total_cashback: matched.reduce((s, o) => s + o.cashback, 0),
        cashback_rate: getCashbackRate(),
      },
      orders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể preview Lazada report.";
    return NextResponse.json({ success: false, error: message }, { status: message === "UNAUTHORIZED" ? 401 : 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdminFromRequest(request);
    const supabase = getSupabase();
    const rows = await readWorkbook(request);
    if (!rows.length) return NextResponse.json({ success: false, error: "File Lazada không có dữ liệu order." }, { status: 400 });
    const preview = buildPreview(rows, await getTrackingMap());

    let imported = 0;
    let skipped = 0;
    let walletCredited = 0;
    let walletReversed = 0;
    let alreadyProcessed = 0;
    const errors: Array<{ external_order_id: string; error: string }> = [];

    for (const item of preview) {
      if (!item.matched || !item.user_id || !item.tracking_id) {
        skipped++;
        continue;
      }

      const { data: existingOrder, error: existingError } = await supabase
        .from("orders")
        .select("id,user_id,status,cashback,approved_at,paid_at")
        .eq("platform", "lazada")
        .eq("external_order_id", item.external_order_id)
        .maybeSingle();
      if (existingError) {
        errors.push({ external_order_id: item.external_order_id, error: existingError.message });
        continue;
      }
      if (existingOrder && existingOrder.user_id !== item.user_id) {
        errors.push({ external_order_id: item.external_order_id, error: "ORDER_USER_MISMATCH" });
        continue;
      }

      const storedStatus: OrderStatus = existingOrder?.status ?? "pending";
      let finalCashback = item.cashback;
      if (existingOrder && Number(existingOrder.cashback ?? 0) > 0) finalCashback = Number(existingOrder.cashback);

      const firstRow = item.rows[0] ?? {};
      const orderedAt = normalizeDate(firstRow["Conversion Time"]);
      const completedAt = normalizeDate(firstRow["Delivered Time"] || firstRow["Fulfilled Time"]);
      const approvedAt = storedStatus === "approved" || storedStatus === "paid"
        ? existingOrder?.approved_at ?? completedAt ?? orderedAt
        : existingOrder?.approved_at ?? null;

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .upsert({
          user_id: existingOrder?.user_id ?? item.user_id,
          platform: "lazada",
          external_order_id: item.external_order_id,
          tracking_id: item.tracking_id,
          product_name: item.product_name,
          order_value: item.order_value,
          commission: item.commission,
          cashback: finalCashback,
          status: storedStatus,
          ordered_at: orderedAt,
          approved_at: approvedAt,
          paid_at: existingOrder?.paid_at ?? null,
          imported_at: new Date().toISOString(),
          raw_data: {
            source: "lazada_conversion_report",
            incoming_status: item.status,
            source_status: item.source_status,
            tracking_candidates: Array.from(new Set(item.rows.flatMap(getTrackingIds))),
            adjustment_total: item.rows.reduce((sum, row) => sum + parseMoney(row["Adjustment"]), 0),
            rows: item.rows,
          },
        }, { onConflict: "platform,external_order_id" })
        .select("id")
        .single();
      if (orderError || !order) {
        errors.push({ external_order_id: item.external_order_id, error: orderError?.message ?? "Không tạo được order." });
        continue;
      }

      const { data: ledgerBefore, error: ledgerError } = await supabase
        .from("wallet_ledger")
        .select("type")
        .eq("order_id", order.id)
        .in("type", ["cashback", "cashback_reversal"]);
      if (ledgerError) {
        errors.push({ external_order_id: item.external_order_id, error: `Không kiểm tra được wallet: ${ledgerError.message}` });
        continue;
      }
      const hadCashback = (ledgerBefore ?? []).some((r) => r.type === "cashback");
      const hadReversal = (ledgerBefore ?? []).some((r) => r.type === "cashback_reversal");

      const { data: rpcResult, error: rpcError } = await supabase.rpc("apply_order_cashback", {
        p_order_id: order.id,
        p_status: item.status,
        p_cashback: finalCashback,
      });
      if (rpcError) {
        errors.push({ external_order_id: item.external_order_id, error: `Không đồng bộ cashback: ${rpcError.message}` });
        continue;
      }

      imported++;
      const rpcData = rpcResult && typeof rpcResult === "object" && !Array.isArray(rpcResult)
        ? rpcResult as { status?: string }
        : null;
      const rpcStatus = clean(rpcData?.status);
      if (!hadCashback && !hadReversal && (rpcStatus === "approved" || rpcStatus === "paid") && finalCashback > 0) {
        walletCredited++;
      } else if (hadCashback && !hadReversal && rpcStatus === "rejected") {
        walletReversed++;
      } else if (hadCashback || hadReversal) {
        alreadyProcessed++;
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        rows: rows.length,
        orders: preview.length,
        imported,
        skipped,
        wallet_credited: walletCredited,
        wallet_reversed: walletReversed,
        already_processed: alreadyProcessed,
        errors: errors.length,
      },
      errors,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể import Lazada report.";
    return NextResponse.json({ success: false, error: message }, { status: message === "UNAUTHORIZED" ? 401 : 500 });
  }
}
