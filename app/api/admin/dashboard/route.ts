import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin";

/*
 * =========================================
 * SUPABASE ADMIN CLIENT
 * =========================================
 */

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "ADMIN DASHBOARD: Missing Supabase server environment variables"
    );

    throw new Error("SERVER_CONFIGURATION_ERROR");
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

/*
 * =========================================
 * HELPERS
 * =========================================
 */

function sum(
  values: Array<
    number | string | null | undefined
  >
): number {
  return values.reduce<number>(
    (total, value) => {
      const n = Number(value ?? 0);

      return (
        total +
        (Number.isFinite(n) ? n : 0)
      );
    },
    0
  );
}

/*
 * =========================================
 * GET /api/admin/dashboard
 * =========================================
 */

export async function GET(
  request: NextRequest
) {
  try {
    /*
     * =========================================
     * 1. ADMIN AUTH
     * =========================================
     */

    const authorization =
      request.headers.get("authorization");

    if (
      !authorization?.startsWith(
        "Bearer "
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    const accessToken =
      authorization
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

    await requireAdmin(accessToken);

    /*
     * Chỉ tạo service-role client
     * sau khi admin đã được xác thực.
     */
    const supabaseAdmin =
      getSupabaseAdmin();

    /*
     * =========================================
     * 2. LOAD DASHBOARD DATA
     * =========================================
     */

    const [
      profilesResult,
      linksResult,
      ordersResult,
      ledgerResult,
      withdrawalsResult,
    ] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id", {
          count: "exact",
          head: true,
        }),

      supabaseAdmin
        .from("affiliate_links")
        .select("id,clicks", {
          count: "exact",
        }),

      supabaseAdmin
        .from("orders")
        .select(`
          id,
          user_id,
          platform,
          external_order_id,
          tracking_id,
          product_name,
          order_value,
          commission,
          cashback,
          status,
          ordered_at,
          approved_at,
          paid_at
        `)
        .order("ordered_at", {
          ascending: false,
        }),

      supabaseAdmin
        .from("wallet_ledger")
        .select(
          "id,user_id,order_id,type,amount,created_at"
        ),

      supabaseAdmin
        .from("withdrawals")
        .select(`
          id,
          user_id,
          amount,
          bank_name,
          account_name,
          account_number,
          status,
          created_at,
          processed_at
        `)
        .order("created_at", {
          ascending: false,
        }),
    ]);

    /*
     * =========================================
     * 3. DATABASE ERRORS
     * =========================================
     */

    if (profilesResult.error) {
      console.error(
        "ADMIN DASHBOARD profiles:",
        profilesResult.error
      );

      throw new Error(
        "DATABASE_QUERY_ERROR"
      );
    }

    if (linksResult.error) {
      console.error(
        "ADMIN DASHBOARD affiliate_links:",
        linksResult.error
      );

      throw new Error(
        "DATABASE_QUERY_ERROR"
      );
    }

    if (ordersResult.error) {
      console.error(
        "ADMIN DASHBOARD orders:",
        ordersResult.error
      );

      throw new Error(
        "DATABASE_QUERY_ERROR"
      );
    }

    if (ledgerResult.error) {
      console.error(
        "ADMIN DASHBOARD wallet_ledger:",
        ledgerResult.error
      );

      throw new Error(
        "DATABASE_QUERY_ERROR"
      );
    }

    if (withdrawalsResult.error) {
      console.error(
        "ADMIN DASHBOARD withdrawals:",
        withdrawalsResult.error
      );

      throw new Error(
        "DATABASE_QUERY_ERROR"
      );
    }

    /*
     * =========================================
     * 4. NORMALIZE DATA
     * =========================================
     */

    const allLinks =
      linksResult.data ?? [];

    const allOrders =
      ordersResult.data ?? [];

    const allLedger =
      ledgerResult.data ?? [];

    const allWithdrawals =
      withdrawalsResult.data ?? [];

    /*
     * =========================================
     * 5. ORDER STATS
     * =========================================
     */

    const approvedOrders =
      allOrders.filter(
        (order) =>
          order.status === "approved" ||
          order.status === "paid"
      );

    const pendingOrders =
      allOrders.filter(
        (order) =>
          order.status === "pending"
      );

    const rejectedOrders =
      allOrders.filter(
        (order) =>
          order.status === "rejected"
      );

    const totalOrderValue = sum(
      approvedOrders.map(
        (order) => order.order_value
      )
    );

    const totalCommission = sum(
      approvedOrders.map(
        (order) => order.commission
      )
    );

    const totalCashback = sum(
      approvedOrders.map(
        (order) => order.cashback
      )
    );

    /*
     * =========================================
     * 6. WALLET STATS
     * =========================================
     */

    const cashbackEntries =
      allLedger.filter(
        (entry) =>
          entry.type === "cashback"
      );

    const reversalEntries =
      allLedger.filter(
        (entry) =>
          entry.type ===
          "cashback_reversal"
      );

    /*
     * Giữ compatibility với dữ liệu cũ
     * nếu từng tồn tại type "withdraw".
     */
    const withdrawalEntries =
      allLedger.filter(
        (entry) =>
          entry.type === "withdrawal" ||
          entry.type === "withdraw"
      );

    const walletBalance = sum(
      allLedger.map(
        (entry) => entry.amount
      )
    );

    const ledgerCashback = sum(
      cashbackEntries.map(
        (entry) => entry.amount
      )
    );

    const cashbackReversed =
      Math.abs(
        sum(
          reversalEntries.map(
            (entry) => entry.amount
          )
        )
      );

    const netCashbackLedger =
      ledgerCashback -
      cashbackReversed;

    const totalWithdrawn =
      withdrawalEntries.reduce<number>(
        (total, entry) => {
          const n = Number(
            entry.amount ?? 0
          );

          return (
            total +
            (Number.isFinite(n)
              ? Math.abs(n)
              : 0)
          );
        },
        0
      );

    /*
     * =========================================
     * 7. WITHDRAWAL STATS
     * =========================================
     */

    const requestedWithdrawals =
      allWithdrawals.filter(
        (item) =>
          item.status === "requested"
      );

    const processingWithdrawals =
      allWithdrawals.filter(
        (item) =>
          item.status === "processing"
      );

    const paidWithdrawals =
      allWithdrawals.filter(
        (item) =>
          item.status === "paid"
      );

    const rejectedWithdrawals =
      allWithdrawals.filter(
        (item) =>
          item.status === "rejected"
      );

    const requestedAmount = sum(
      requestedWithdrawals.map(
        (item) => item.amount
      )
    );

    const processingAmount = sum(
      processingWithdrawals.map(
        (item) => item.amount
      )
    );

    const paidAmount = sum(
      paidWithdrawals.map(
        (item) => item.amount
      )
    );

    const reservedWithdrawal =
      requestedAmount +
      processingAmount;

    const availableBalance =
      walletBalance -
      reservedWithdrawal;

    /*
     * =========================================
     * 8. LEDGER BY ORDER
     * =========================================
     */

    const ledgerByOrder = new Map<
      string,
      {
        cashback: number;
        reversal: number;
      }
    >();

    for (const entry of allLedger) {
      if (!entry.order_id) {
        continue;
      }

      const current =
        ledgerByOrder.get(
          entry.order_id
        ) ?? {
          cashback: 0,
          reversal: 0,
        };

      const amount = Number(
        entry.amount ?? 0
      );

      const safeAmount =
        Number.isFinite(amount)
          ? amount
          : 0;

      if (
        entry.type === "cashback"
      ) {
        current.cashback +=
          safeAmount;
      }

      if (
        entry.type ===
        "cashback_reversal"
      ) {
        current.reversal +=
          Math.abs(safeAmount);
      }

      ledgerByOrder.set(
        entry.order_id,
        current
      );
    }

    /*
     * =========================================
     * 9. RECONCILIATION
     * =========================================
     */

    const approvedMissingCashback =
      approvedOrders.filter(
        (order) => {
          const wallet =
            ledgerByOrder.get(
              order.id
            );

          const creditedCashback =
            wallet?.cashback ?? 0;

          return (
            Number(
              order.cashback ?? 0
            ) > 0 &&
            creditedCashback <= 0
          );
        }
      );

    const rejectedMissingReversal =
      rejectedOrders.filter(
        (order) => {
          const wallet =
            ledgerByOrder.get(
              order.id
            );

          const creditedCashback =
            wallet?.cashback ?? 0;

          const reversedCashback =
            wallet?.reversal ?? 0;

          return (
            creditedCashback > 0 &&
            reversedCashback <= 0
          );
        }
      );

    const ledgerMismatchOrders =
      approvedOrders.filter(
        (order) => {
          const wallet =
            ledgerByOrder.get(
              order.id
            );

          if (!wallet?.cashback) {
            return false;
          }

          return (
            Math.abs(
              wallet.cashback -
                Number(
                  order.cashback ??
                    0
                )
            ) > 0.01
          );
        }
      );

    /*
     * =========================================
     * 10. PLATFORM STATS
     * =========================================
     */

    function platformStats(
      platform:
        | "shopee"
        | "lazada"
        | "tiktok"
    ) {
      const orders =
        allOrders.filter(
          (order) =>
            order.platform ===
            platform
        );

      const approved =
        orders.filter(
          (order) =>
            order.status ===
              "approved" ||
            order.status === "paid"
        );

      return {
        orders:
          orders.length,

        approved:
          approved.length,

        pending:
          orders.filter(
            (order) =>
              order.status ===
              "pending"
          ).length,

        rejected:
          orders.filter(
            (order) =>
              order.status ===
              "rejected"
          ).length,

        orderValue: sum(
          approved.map(
            (order) =>
              order.order_value
          )
        ),

        commission: sum(
          approved.map(
            (order) =>
              order.commission
          )
        ),

        cashback: sum(
          approved.map(
            (order) =>
              order.cashback
          )
        ),
      };
    }

    /*
     * =========================================
     * 11. RESPONSE
     * =========================================
     */

    return NextResponse.json({
      success: true,

      stats: {
        users:
          profilesResult.count ?? 0,

        affiliateLinks:
          linksResult.count ?? 0,

        totalClicks: sum(
          allLinks.map(
            (link) => link.clicks
          )
        ),

        orders:
          allOrders.length,

        approvedOrders:
          approvedOrders.length,

        pendingOrders:
          pendingOrders.length,

        rejectedOrders:
          rejectedOrders.length,

        totalOrderValue,
        totalCommission,
        totalCashback,

        walletBalance,
        ledgerCashback,
        cashbackReversed,
        netCashbackLedger,
        totalWithdrawn,

        withdrawals:
          allWithdrawals.length,

        requestedWithdrawals:
          requestedWithdrawals.length,

        processingWithdrawals:
          processingWithdrawals.length,

        paidWithdrawals:
          paidWithdrawals.length,

        rejectedWithdrawals:
          rejectedWithdrawals.length,

        requestedAmount,
        processingAmount,
        paidAmount,
        reservedWithdrawal,
        availableBalance,

        approvedMissingCashback:
          approvedMissingCashback.length,

        rejectedMissingReversal:
          rejectedMissingReversal.length,

        ledgerMismatchOrders:
          ledgerMismatchOrders.length,
      },

      platforms: {
        shopee:
          platformStats("shopee"),

        lazada:
          platformStats("lazada"),

        tiktok:
          platformStats("tiktok"),
      },

      alerts: {
        approvedMissingCashback:
          approvedMissingCashback
            .slice(0, 10)
            .map((order) => ({
              id: order.id,

              external_order_id:
                order.external_order_id,

              platform:
                order.platform,

              cashback:
                Number(
                  order.cashback ??
                    0
                ),
            })),

        rejectedMissingReversal:
          rejectedMissingReversal
            .slice(0, 10)
            .map((order) => ({
              id: order.id,

              external_order_id:
                order.external_order_id,

              platform:
                order.platform,

              cashback:
                Number(
                  order.cashback ??
                    0
                ),
            })),

        ledgerMismatchOrders:
          ledgerMismatchOrders
            .slice(0, 10)
            .map((order) => ({
              id: order.id,

              external_order_id:
                order.external_order_id,

              platform:
                order.platform,

              cashback:
                Number(
                  order.cashback ??
                    0
                ),

              ledger_cashback:
                ledgerByOrder.get(
                  order.id
                )?.cashback ?? 0,
            })),
      },

      recentOrders:
        allOrders.slice(0, 10),

      recentWithdrawals:
        allWithdrawals.slice(
          0,
          10
        ),
    });
  } catch (error) {
    /*
     * =========================================
     * 12. ERROR HANDLING
     * =========================================
     */

    console.error(
      "ADMIN DASHBOARD ERROR:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "INTERNAL_SERVER_ERROR";

    if (
      message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    if (message === "FORBIDDEN") {
      return NextResponse.json(
        {
          success: false,
          error: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    if (
      message ===
      "SERVER_CONFIGURATION_ERROR"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "SERVER_CONFIGURATION_ERROR",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "INTERNAL_SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}