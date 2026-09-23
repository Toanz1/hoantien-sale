import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { requireAdmin } from "@/lib/admin";
import {
  AccessTradeTransaction,
  findTrackingMatch,
  mapTransactionStatus,
} from "@/lib/accesstrade";

type OrderStatus = "pending" | "approved" | "rejected" | "paid";

type AffiliateLink = {
  id: string;
  user_id: string;
  platform: "tiktok";
  tracking_id: string;
  original_url: string;
  affiliate_url: string;
};

type ExistingOrder = {
  id: string;
  status: OrderStatus;
  cashback: number;
  user_id: string;
  approved_at: string | null;
  paid_at: string | null;
};

const AT_API_URL = "https://api.accesstrade.vn/v1/transactions";
const CASHBACK_RATE = 0.7;
const REQUEST_TIMEOUT_MS = 30_000;
const PAGE_DELAY_MS = 6_500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractTransactions(payload: any): AccessTradeTransaction[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.transactions)) return payload.transactions;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
}

function normalizeNumber(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export async function GET(request: Request) {
  try {
    // 1. Admin auth
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Thiếu access token." },
        { status: 401 }
      );
    }

    const accessToken = authHeader.replace("Bearer ", "").trim();

    try {
      await requireAdmin(accessToken);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "FORBIDDEN";

      return NextResponse.json(
        {
          success: false,
          error:
            message === "UNAUTHORIZED"
              ? "Bạn chưa đăng nhập hoặc phiên đã hết hạn."
              : "Bạn không có quyền Admin.",
        },
        { status: message === "UNAUTHORIZED" ? 401 : 403 }
      );
    }

    // 2. Env
    const apiKey = process.env.ACCESSTRADE_API_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl) {
      return NextResponse.json(
        { success: false, error: "Thiếu NEXT_PUBLIC_SUPABASE_URL." },
        { status: 500 }
      );
    }

    if (!serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: "Thiếu SUPABASE_SERVICE_ROLE_KEY." },
        { status: 500 }
      );
    }

    // 3. Params
    const requestUrl = new URL(request.url);

    const daysParam = Number(requestUrl.searchParams.get("days") || "30");
    const limitParam = Number(requestUrl.searchParams.get("limit") || "100");
    const maxPagesParam = Number(
      requestUrl.searchParams.get("max_pages") || "10"
    );

    const mockMode = requestUrl.searchParams.get("mock") === "1";
    const mockTrackingId =
      requestUrl.searchParams.get("tracking_id")?.trim() || "";

    const mockStatusParam = Number(
      requestUrl.searchParams.get("mock_status") || "1"
    );

    const mockStatus: 0 | 1 | 2 =
      mockStatusParam === 2 ? 2 : mockStatusParam === 0 ? 0 : 1;

    if (mockMode && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { success: false, error: "Mock sync bị khóa trên production." },
        { status: 403 }
      );
    }

    if (!mockMode && !apiKey) {
      return NextResponse.json(
        { success: false, error: "Thiếu ACCESSTRADE_API_KEY." },
        { status: 500 }
      );
    }

    const days = Math.min(
      Math.max(Number.isFinite(daysParam) ? daysParam : 30, 1),
      90
    );

    const limit = Math.min(
      Math.max(Number.isFinite(limitParam) ? limitParam : 100, 1),
      100
    );

    const maxPages = Math.min(
      Math.max(Number.isFinite(maxPagesParam) ? maxPagesParam : 10, 1),
      10
    );

    // 4. Supabase service role
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 5. TikTok links ONLY.
    // Shopee/Lazada tuyệt đối không đi qua ACCESSTRADE.
    const { data: affiliateLinks, error: affiliateError } = await supabase
      .from("affiliate_links")
      .select(
        "id,user_id,platform,tracking_id,original_url,affiliate_url"
      )
      .eq("platform", "tiktok");

    if (affiliateError) {
      return NextResponse.json(
        {
          success: false,
          error: "Không thể đọc affiliate_links TikTok.",
          detail: affiliateError.message,
        },
        { status: 500 }
      );
    }

    const links = (affiliateLinks || []) as AffiliateLink[];
    const knownTrackingIds = new Set(
      links.map((item) => item.tracking_id)
    );

    const linkByTracking = new Map(
      links.map((item) => [item.tracking_id, item])
    );

    // 6. Time range
    const until = new Date();
    const since = new Date(
      until.getTime() - days * 24 * 60 * 60 * 1000
    );

    const allTransactions: AccessTradeTransaction[] = [];
    const synced: unknown[] = [];
    const skipped: unknown[] = [];
    const errors: unknown[] = [];

    let pagesFetched = 0;
    let walletCredited = 0;
    let walletReversed = 0;
    let alreadyProcessed = 0;

    // 7. Fetch/mock
    if (mockMode) {
      const selectedTrackingId =
        mockTrackingId || links[0]?.tracking_id || "";

      if (!selectedTrackingId) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Không có tracking_id TikTok để chạy mock. Hãy tạo một link TikTok trước.",
          },
          { status: 400 }
        );
      }

      if (!knownTrackingIds.has(selectedTrackingId)) {
        return NextResponse.json(
          {
            success: false,
            error:
              "tracking_id không tồn tại trong affiliate_links platform=tiktok.",
            tracking_id: selectedTrackingId,
          },
          { status: 404 }
        );
      }

      const now = new Date().toISOString();

      allTransactions.push({
        transaction_id: "TEST-TIKTOK-ACCESSTRADE-20260923-001",
        merchant: "tiktokshop",
        status: mockStatus,
        is_confirmed: mockStatus === 1,
        transaction_value: 500000,
        commission: 25000,
        product_id: "TEST-TIKTOK-PRODUCT",
        product_name: "TEST TikTok Shop Product",
        transaction_time: now,
        update_time: now,
        tracking_id: selectedTrackingId,
        sub1: selectedTrackingId,
        utm_content: selectedTrackingId,
      } as AccessTradeTransaction);

      pagesFetched = 1;
    } else {
      for (let page = 0; page < maxPages; page++) {
        const offset = page * limit;
        const apiUrl = new URL(AT_API_URL);

        apiUrl.searchParams.set("since", since.toISOString());
        apiUrl.searchParams.set("until", until.toISOString());
        apiUrl.searchParams.set("limit", String(limit));
        apiUrl.searchParams.set("offset", String(offset));

        const controller = new AbortController();
        const timeout = setTimeout(
          () => controller.abort(),
          REQUEST_TIMEOUT_MS
        );

        let response: Response;

        try {
          response = await fetch(apiUrl.toString(), {
            method: "GET",
            headers: {
              Authorization: `Token ${apiKey}`,
              Accept: "application/json",
            },
            cache: "no-store",
            signal: controller.signal,
          });
        } catch (error) {
          if (
            error instanceof Error &&
            error.name === "AbortError"
          ) {
            throw new Error(
              "ACCESSTRADE timeout: API không phản hồi trong 30 giây."
            );
          }

          throw new Error(
            `Không kết nối được ACCESSTRADE: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        } finally {
          clearTimeout(timeout);
        }

        const responseText = await response.text();

        if (!response.ok) {
          throw new Error(
            `ACCESSTRADE HTTP ${response.status}: ${responseText.slice(
              0,
              1000
            )}`
          );
        }

        let data: any;

        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error(
            `ACCESSTRADE trả về dữ liệu không phải JSON: ${responseText.slice(
              0,
              1000
            )}`
          );
        }

        const pageTransactions = extractTransactions(data);
        pagesFetched++;
        allTransactions.push(...pageTransactions);

        if (pageTransactions.length < limit) break;

        if (page < maxPages - 1) {
          await sleep(PAGE_DELAY_MS);
        }
      }
    }

    // 8. Dedupe
    const uniqueTransactions = new Map<
      string,
      AccessTradeTransaction
    >();

    for (const transaction of allTransactions) {
      const transactionId =
        transaction.transaction_id || (transaction as any).id;

      if (!transactionId) continue;

      uniqueTransactions.set(String(transactionId), transaction);
    }

    const transactionsToProcess = Array.from(
      uniqueTransactions.values()
    );

    // 9. Process
    for (const transaction of transactionsToProcess) {
      try {
        const transactionId =
          transaction.transaction_id || (transaction as any).id;

        if (!transactionId) {
          skipped.push({
            reason: "TRANSACTION_ID_MISSING",
            transaction,
          });
          continue;
        }

        const trackingMatch = findTrackingMatch(
          transaction,
          knownTrackingIds
        );

        if (!trackingMatch) {
          skipped.push({
            transaction_id: transactionId,
            reason: "TRACKING_NOT_FOUND",
          });
          continue;
        }

        const affiliateLink = linkByTracking.get(
          trackingMatch.trackingId
        );

        if (!affiliateLink) {
          skipped.push({
            transaction_id: transactionId,
            tracking_id: trackingMatch.trackingId,
            reason: "TIKTOK_AFFILIATE_LINK_NOT_FOUND",
          });
          continue;
        }

        // Safety belt: ACCESSTRADE sync chỉ được tạo TikTok orders.
        if (affiliateLink.platform !== "tiktok") {
          skipped.push({
            transaction_id: transactionId,
            tracking_id: trackingMatch.trackingId,
            reason: "NON_TIKTOK_LINK_BLOCKED",
          });
          continue;
        }

        const orderValue = normalizeNumber(
          transaction.transaction_value
        );

        const commission = normalizeNumber(transaction.commission);

        const incomingStatus = mapTransactionStatus(
          transaction.status
        ) as OrderStatus;

        const calculatedCashback =
          incomingStatus === "rejected"
            ? 0
            : Math.round(commission * CASHBACK_RATE);

        // Existing order
        const {
          data: existingOrderRaw,
          error: existingOrderError,
        } = await supabase
          .from("orders")
          .select(
            "id,status,cashback,user_id,approved_at,paid_at"
          )
          .eq("platform", "tiktok")
          .eq("external_order_id", String(transactionId))
          .maybeSingle();

        if (existingOrderError) {
          errors.push({
            transaction_id: transactionId,
            tracking_id: trackingMatch.trackingId,
            error: existingOrderError.message,
            code: existingOrderError.code,
          });
          continue;
        }

        const existingOrder =
          existingOrderRaw as ExistingOrder | null;

        /*
         * Không ghi incoming status vào order cũ trước RPC.
         * RPC phải nhìn thấy status hiện tại để xử lý transition an toàn.
         *
         * Order mới luôn được tạo ở pending trước.
         */
        const storedStatus: OrderStatus =
          existingOrder?.status ?? "pending";

        let finalCashback = calculatedCashback;

        // Nếu order từng có cashback thì giữ số đã ghi nhận.
        // Quan trọng cho approved -> rejected để RPC reversal đúng số cũ.
        if (
          existingOrder &&
          normalizeNumber(existingOrder.cashback) > 0
        ) {
          finalCashback = normalizeNumber(existingOrder.cashback);
        }

        const orderPayload = {
          user_id: affiliateLink.user_id,
          platform: "tiktok",
          external_order_id: String(transactionId),
          tracking_id: trackingMatch.trackingId,
          product_name: transaction.product_name || null,
          order_value: orderValue,
          commission,
          cashback: finalCashback,
          status: storedStatus,
          ordered_at: transaction.transaction_time || null,
          approved_at: existingOrder?.approved_at ?? null,
          paid_at: existingOrder?.paid_at ?? null,
          imported_at: new Date().toISOString(),
          raw_data: transaction,
        };

        const { data: order, error: orderError } = await supabase
          .from("orders")
          .upsert(orderPayload, {
            onConflict: "platform,external_order_id",
          })
          .select("id,status,cashback,user_id,approved_at,paid_at")
          .single();

        if (orderError || !order) {
          errors.push({
            transaction_id: transactionId,
            tracking_id: trackingMatch.trackingId,
            error:
              orderError?.message ?? "Không tạo/cập nhật được order.",
            code: orderError?.code,
          });
          continue;
        }

        // Ledger before RPC chỉ dùng để thống kê UI.
        const { data: ledgerBefore, error: ledgerBeforeError } =
          await supabase
            .from("wallet_ledger")
            .select("type")
            .eq("order_id", order.id)
            .in("type", ["cashback", "cashback_reversal"]);

        if (ledgerBeforeError) {
          errors.push({
            transaction_id: transactionId,
            order_id: order.id,
            error: `Không kiểm tra được wallet trước RPC: ${ledgerBeforeError.message}`,
          });
          continue;
        }

        const hadCashback = (ledgerBefore ?? []).some(
          (row) => row.type === "cashback"
        );

        const hadReversal = (ledgerBefore ?? []).some(
          (row) => row.type === "cashback_reversal"
        );

        // 10. Atomic status + cashback/reversal
        const { data: rpcResult, error: rpcError } =
          await supabase.rpc("apply_order_cashback", {
            p_order_id: order.id,
            p_status: incomingStatus,
            p_cashback: finalCashback,
          });

        if (rpcError) {
          errors.push({
            transaction_id: transactionId,
            order_id: order.id,
            tracking_id: trackingMatch.trackingId,
            error: `Không đồng bộ cashback: ${rpcError.message}`,
          });
          continue;
        }

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

        const currentStatus = String(
          rpcData?.status ?? incomingStatus
        ) as OrderStatus;

        // Ledger after RPC để biết chính xác action vừa xảy ra.
        const { data: ledgerAfter, error: ledgerAfterError } =
          await supabase
            .from("wallet_ledger")
            .select("type")
            .eq("order_id", order.id)
            .in("type", ["cashback", "cashback_reversal"]);

        if (ledgerAfterError) {
          errors.push({
            transaction_id: transactionId,
            order_id: order.id,
            error: `Không kiểm tra được wallet sau RPC: ${ledgerAfterError.message}`,
          });
          continue;
        }

        const hasCashbackAfter = (ledgerAfter ?? []).some(
          (row) => row.type === "cashback"
        );

        const hasReversalAfter = (ledgerAfter ?? []).some(
          (row) => row.type === "cashback_reversal"
        );

        let walletAction:
          | "NONE"
          | "CASHBACK_CREDITED"
          | "CASHBACK_REVERSED"
          | "ALREADY_PROCESSED" = "NONE";

        if (!hadCashback && hasCashbackAfter) {
          walletAction = "CASHBACK_CREDITED";
          walletCredited++;
        } else if (!hadReversal && hasReversalAfter) {
          walletAction = "CASHBACK_REVERSED";
          walletReversed++;
        } else if (
          hadCashback ||
          hadReversal ||
          (incomingStatus === "approved" && hasCashbackAfter) ||
          (incomingStatus === "rejected" && hasReversalAfter)
        ) {
          walletAction = "ALREADY_PROCESSED";
          alreadyProcessed++;
        }

        // Notification: chỉ tạo khi cashback vừa được cộng.
        let notificationAction = "NONE";

        if (walletAction === "CASHBACK_CREDITED") {
          const notificationType = "order_approved";

          const { data: existingNotification } = await supabase
            .from("notifications")
            .select("id")
            .eq("user_id", affiliateLink.user_id)
            .eq("order_id", order.id)
            .eq("type", notificationType)
            .maybeSingle();

          if (existingNotification) {
            notificationAction = "ALREADY_EXISTS";
          } else {
            const { error: notificationError } = await supabase
              .from("notifications")
              .insert({
                user_id: affiliateLink.user_id,
                order_id: order.id,
                type: notificationType,
                title: "Đơn TikTok Shop đã được duyệt 🎉",
                message: `Bạn nhận được ${Number(
                  finalCashback
                ).toLocaleString("vi-VN")} ₫ tiền hoàn.`,
                is_read: false,
              });

            notificationAction = notificationError
              ? "INSERT_ERROR"
              : "CREATED";
          }
        }

        synced.push({
          transaction_id: String(transactionId),
          tracking_id: trackingMatch.trackingId,
          tracking_source: trackingMatch.source,
          user_id: affiliateLink.user_id,
          platform: "tiktok",
          previous_status: existingOrder?.status ?? null,
          incoming_status: incomingStatus,
          current_status: currentStatus,
          commission,
          cashback: finalCashback,
          cashback_rate: CASHBACK_RATE,
          wallet_action: walletAction,
          notification_action: notificationAction,
          order_id: order.id,
        });
      } catch (transactionError) {
        errors.push({
          error:
            transactionError instanceof Error
              ? transactionError.message
              : "Transaction processing error.",
        });
      }
    }

    return NextResponse.json({
      success: true,
      mode: mockMode ? "mock" : "live",
      query: {
        days,
        limit,
        max_pages: maxPages,
        pages_fetched: pagesFetched,
        mock: mockMode,
        mock_tracking_id: mockMode
          ? mockTrackingId || links[0]?.tracking_id || null
          : null,
        mock_status: mockMode ? mockStatus : null,
        cashback_rate: CASHBACK_RATE,
        since: since.toISOString(),
        until: until.toISOString(),
      },
      summary: {
        tiktok_affiliate_links: links.length,
        affiliate_links: links.length,
        transactions: transactionsToProcess.length,
        synced: synced.length,
        skipped: skipped.length,
        wallet_credited: walletCredited,
        wallet_reversed: walletReversed,
        already_processed: alreadyProcessed,
        errors: errors.length,
      },
      synced,
      skipped,
      errors,
      transactions: transactionsToProcess,
    });
  } catch (error) {
    console.error("ACCESSTRADE sync error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Không thể sync ACCESSTRADE.",
      },
      { status: 500 }
    );
  }
}
