import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin";

const PAGE_SIZE = 20;

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
      "ADMIN USERS: Missing Supabase server environment variables"
    );

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
      const numericValue =
        Number(value ?? 0);

      return (
        total +
        (Number.isFinite(
          numericValue
        )
          ? numericValue
          : 0)
      );
    },
    0
  );
}

function maskAccount(
  value: string | null | undefined
): string {
  const clean =
    String(value ?? "").trim();

  if (!clean) {
    return "";
  }

  if (clean.length <= 4) {
    return "*".repeat(
      clean.length
    );
  }

  return `${"*".repeat(
    Math.max(
      4,
      clean.length - 4
    )
  )}${clean.slice(-4)}`;
}

/*
 * =========================================
 * GET /api/admin/users
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
      request.headers.get(
        "authorization"
      );

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

    await requireAdmin(
      accessToken
    );

    /*
     * Service-role chỉ được tạo
     * sau khi admin đã xác thực.
     */
    const supabaseAdmin =
      getSupabaseAdmin();

    /*
     * =========================================
     * 2. QUERY PARAMS
     * =========================================
     */

    const searchParams =
      request.nextUrl.searchParams;

    const search =
      searchParams
        .get("search")
        ?.trim() ?? "";

    const pageParam =
      Number(
        searchParams.get("page") ??
          "1"
      );

    const page =
      Number.isFinite(
        pageParam
      ) &&
      pageParam > 0
        ? Math.floor(pageParam)
        : 1;

    /*
     * =========================================
     * 3. LOAD PROFILES
     * =========================================
     */

    const {
      data: profiles,
      error: profilesError,
    } = await supabaseAdmin
      .from("profiles")
      .select(`
        id,
        full_name,
        phone,
        role,
        created_at,
        bank_name,
        bank_account_number,
        bank_account_name
      `);

    if (profilesError) {
      console.error(
        "ADMIN USERS profiles:",
        profilesError
      );

      throw new Error(
        "DATABASE_QUERY_ERROR"
      );
    }

    const allProfiles =
      profiles ?? [];

    const userIds =
      allProfiles
        .map(
          (profile) =>
            profile.id
        )
        .filter(
          (
            id
          ): id is string =>
            typeof id ===
              "string" &&
            id.length > 0
        );

    /*
     * =========================================
     * 4. EMPTY STATE
     * =========================================
     */

    if (
      userIds.length === 0
    ) {
      return NextResponse.json({
        success: true,

        users: [],

        pagination: {
          page: 1,
          pageSize:
            PAGE_SIZE,
          total: 0,
          totalPages: 1,
        },
      });
    }

    /*
     * =========================================
     * 5. LOAD USER DATA
     * =========================================
     */

    const [
      linksResult,
      ordersResult,
      ledgerResult,
      withdrawalsResult,
    ] = await Promise.all([
      supabaseAdmin
        .from(
          "affiliate_links"
        )
        .select(`
          id,
          user_id,
          platform,
          clicks
        `)
        .in(
          "user_id",
          userIds
        ),

      supabaseAdmin
        .from("orders")
        .select(`
          id,
          user_id,
          platform,
          order_value,
          cashback,
          status
        `)
        .in(
          "user_id",
          userIds
        ),

      supabaseAdmin
        .from(
          "wallet_ledger"
        )
        .select(`
          id,
          user_id,
          type,
          amount
        `)
        .in(
          "user_id",
          userIds
        ),

      supabaseAdmin
        .from(
          "withdrawals"
        )
        .select(`
          id,
          user_id,
          amount,
          status
        `)
        .in(
          "user_id",
          userIds
        ),
    ]);

    /*
     * =========================================
     * 6. DATABASE ERRORS
     * =========================================
     */

    if (
      linksResult.error
    ) {
      console.error(
        "ADMIN USERS affiliate_links:",
        linksResult.error
      );

      throw new Error(
        "DATABASE_QUERY_ERROR"
      );
    }

    if (
      ordersResult.error
    ) {
      console.error(
        "ADMIN USERS orders:",
        ordersResult.error
      );

      throw new Error(
        "DATABASE_QUERY_ERROR"
      );
    }

    if (
      ledgerResult.error
    ) {
      console.error(
        "ADMIN USERS wallet_ledger:",
        ledgerResult.error
      );

      throw new Error(
        "DATABASE_QUERY_ERROR"
      );
    }

    if (
      withdrawalsResult.error
    ) {
      console.error(
        "ADMIN USERS withdrawals:",
        withdrawalsResult.error
      );

      throw new Error(
        "DATABASE_QUERY_ERROR"
      );
    }

    const allLinks =
      linksResult.data ?? [];

    const allOrders =
      ordersResult.data ?? [];

    const allLedger =
      ledgerResult.data ?? [];

    const allWithdrawals =
      withdrawalsResult.data ??
      [];

    /*
     * =========================================
     * 7. GROUP DATA BY USER
     * =========================================
     */

    const linksByUser =
      new Map<
        string,
        typeof allLinks
      >();

    const ordersByUser =
      new Map<
        string,
        typeof allOrders
      >();

    const ledgerByUser =
      new Map<
        string,
        typeof allLedger
      >();

    const withdrawalsByUser =
      new Map<
        string,
        typeof allWithdrawals
      >();

    for (
      const item of
      allLinks
    ) {
      if (!item.user_id) {
        continue;
      }

      const rows =
        linksByUser.get(
          item.user_id
        ) ?? [];

      rows.push(item);

      linksByUser.set(
        item.user_id,
        rows
      );
    }

    for (
      const item of
      allOrders
    ) {
      if (!item.user_id) {
        continue;
      }

      const rows =
        ordersByUser.get(
          item.user_id
        ) ?? [];

      rows.push(item);

      ordersByUser.set(
        item.user_id,
        rows
      );
    }

    for (
      const item of
      allLedger
    ) {
      if (!item.user_id) {
        continue;
      }

      const rows =
        ledgerByUser.get(
          item.user_id
        ) ?? [];

      rows.push(item);

      ledgerByUser.set(
        item.user_id,
        rows
      );
    }

    for (
      const item of
      allWithdrawals
    ) {
      if (!item.user_id) {
        continue;
      }

      const rows =
        withdrawalsByUser.get(
          item.user_id
        ) ?? [];

      rows.push(item);

      withdrawalsByUser.set(
        item.user_id,
        rows
      );
    }

    /*
     * =========================================
     * 8. BUILD USER STATS
     * =========================================
     */

    const users =
      allProfiles.map(
        (profile) => {
          const userLinks =
            linksByUser.get(
              profile.id
            ) ?? [];

          const userOrders =
            ordersByUser.get(
              profile.id
            ) ?? [];

          const userLedger =
            ledgerByUser.get(
              profile.id
            ) ?? [];

          const userWithdrawals =
            withdrawalsByUser.get(
              profile.id
            ) ?? [];

          /*
           * Approved + paid:
           * đơn hợp lệ cho báo cáo.
           */

          const approvedOrders =
            userOrders.filter(
              (order) =>
                order.status ===
                  "approved" ||
                order.status ===
                  "paid"
            );

          const rejectedOrders =
            userOrders.filter(
              (order) =>
                order.status ===
                "rejected"
            );

          /*
           * Wallet balance:
           * cộng trực tiếp toàn bộ ledger.
           *
           * cashback_reversal và
           * withdrawal là số âm.
           */

          const walletBalance =
            sum(
              userLedger.map(
                (entry) =>
                  entry.amount
              )
            );

          /*
           * Withdrawal requested /
           * processing được giữ chỗ.
           */

          const reservedWithdrawal =
            sum(
              userWithdrawals
                .filter(
                  (item) =>
                    item.status ===
                      "requested" ||
                    item.status ===
                      "processing"
                )
                .map(
                  (item) =>
                    item.amount
                )
            );

          const availableBalance =
            walletBalance -
            reservedWithdrawal;

          /*
           * Orders theo platform.
           */

          const platformOrders = {
            shopee:
              userOrders.filter(
                (item) =>
                  item.platform ===
                  "shopee"
              ).length,

            lazada:
              userOrders.filter(
                (item) =>
                  item.platform ===
                  "lazada"
              ).length,

            tiktok:
              userOrders.filter(
                (item) =>
                  item.platform ===
                  "tiktok"
              ).length,
          };

          const totalOrderValue =
            sum(
              approvedOrders.map(
                (order) =>
                  order.order_value
              )
            );

          const totalCashback =
            sum(
              approvedOrders.map(
                (order) =>
                  order.cashback
              )
            );

          const totalClicks =
            sum(
              userLinks.map(
                (link) =>
                  link.clicks
              )
            );

          return {
            id:
              profile.id,

            full_name:
              profile.full_name ??
              "",

            phone:
              profile.phone ??
              "",

            role:
              profile.role ??
              "user",

            created_at:
              profile.created_at,

            /*
             * Affiliate
             */

            affiliate_links:
              userLinks.length,

            total_clicks:
              totalClicks,

            /*
             * Orders
             */

            orders:
              userOrders.length,

            approved_orders:
              approvedOrders.length,

            rejected_orders:
              rejectedOrders.length,

            platform_orders:
              platformOrders,

            total_order_value:
              totalOrderValue,

            total_cashback:
              totalCashback,

            /*
             * Wallet
             */

            wallet_balance:
              walletBalance,

            reserved_withdrawal:
              reservedWithdrawal,

            available_balance:
              availableBalance,

            /*
             * Bank
             *
             * Không trả số tài khoản
             * đầy đủ về Admin Users.
             */

            bank: {
              configured:
                Boolean(
                  profile.bank_name &&
                    profile.bank_account_number &&
                    profile.bank_account_name
                ),

              bank_name:
                profile.bank_name ??
                "",

              account_number_masked:
                maskAccount(
                  profile.bank_account_number
                ),

              account_name:
                profile.bank_account_name ??
                "",
            },
          };
        }
      );

    /*
     * =========================================
     * 9. SEARCH
     * =========================================
     */

    const normalizedSearch =
      search.toLowerCase();

    const filteredUsers =
      normalizedSearch
        ? users.filter(
            (user) =>
              user.id
                .toLowerCase()
                .includes(
                  normalizedSearch
                ) ||
              user.full_name
                .toLowerCase()
                .includes(
                  normalizedSearch
                ) ||
              user.phone
                .toLowerCase()
                .includes(
                  normalizedSearch
                )
          )
        : users;

    /*
     * =========================================
     * 10. SORT
     * =========================================
     *
     * Giữ nguyên logic cũ:
     * tổng giá trị đơn approved/paid
     * cao hơn đứng trước.
     *
     * Nếu bằng nhau:
     * user mới hơn đứng trước.
     */

    filteredUsers.sort(
      (a, b) => {
        const valueDiff =
          b.total_order_value -
          a.total_order_value;

        if (
          valueDiff !== 0
        ) {
          return valueDiff;
        }

        const bCreatedAt =
          b.created_at
            ? new Date(
                b.created_at
              ).getTime()
            : 0;

        const aCreatedAt =
          a.created_at
            ? new Date(
                a.created_at
              ).getTime()
            : 0;

        return (
          bCreatedAt -
          aCreatedAt
        );
      }
    );

    /*
     * =========================================
     * 11. PAGINATION
     * =========================================
     */

    const total =
      filteredUsers.length;

    const totalPages =
      Math.max(
        1,
        Math.ceil(
          total /
            PAGE_SIZE
        )
      );

    const safePage =
      Math.min(
        page,
        totalPages
      );

    const from =
      (safePage - 1) *
      PAGE_SIZE;

    const paginatedUsers =
      filteredUsers.slice(
        from,
        from + PAGE_SIZE
      );

    /*
     * =========================================
     * 12. RESPONSE
     * =========================================
     */

    return NextResponse.json({
      success: true,

      users:
        paginatedUsers,

      pagination: {
        page:
          safePage,

        pageSize:
          PAGE_SIZE,

        total,

        totalPages,
      },
    });
  } catch (error) {
    /*
     * =========================================
     * ERROR HANDLING
     * =========================================
     */

    console.error(
      "ADMIN USERS ERROR:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "INTERNAL_SERVER_ERROR";

    if (
      message ===
      "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    if (
      message ===
      "FORBIDDEN"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "FORBIDDEN",
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