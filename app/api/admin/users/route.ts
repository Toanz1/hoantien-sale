import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

const PAGE_SIZE = 20;

/*
 * Luôn trả về number.
 * reduce<number> tránh TypeScript suy luận accumulator thành
 * string | number khi dữ liệu Supabase có thể là numeric/string.
 */
function sum(
  values: Array<number | string | null | undefined>
): number {
  return values.reduce<number>((total, value) => {
    const numericValue = Number(value ?? 0);

    return (
      total +
      (Number.isFinite(numericValue)
        ? numericValue
        : 0)
    );
  }, 0);
}

function maskAccount(
  value: string | null | undefined
): string {
  const clean = String(value ?? "").trim();

  if (!clean) {
    return "";
  }

  if (clean.length <= 4) {
    return "*".repeat(clean.length);
  }

  return `${"*".repeat(
    Math.max(4, clean.length - 4)
  )}${clean.slice(-4)}`;
}

export async function GET(request: NextRequest) {
  try {
    /*
     * =========================
     * ADMIN AUTH
     * =========================
     */

    const authorization =
      request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    const accessToken = authorization
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
     * =========================
     * QUERY PARAMS
     * =========================
     */

    const { searchParams } =
      new URL(request.url);

    const search =
      searchParams.get("search")?.trim() || "";

    const pageParam =
      Number(searchParams.get("page") || "1");

    const page =
      Number.isFinite(pageParam) &&
      pageParam > 0
        ? Math.floor(pageParam)
        : 1;

    /*
     * =========================
     * LOAD PROFILES
     * =========================
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
      throw new Error(
        `profiles: ${profilesError.message}`
      );
    }

    const allProfiles = profiles ?? [];

    const userIds = allProfiles.map(
      (profile) => profile.id
    );

    /*
     * Không có profile nào
     */

    if (userIds.length === 0) {
      return NextResponse.json({
        success: true,

        users: [],

        pagination: {
          page: 1,
          pageSize: PAGE_SIZE,
          total: 0,
          totalPages: 1,
        },
      });
    }

    /*
     * =========================
     * LOAD USER DATA
     * =========================
     *
     * Chạy song song:
     * - affiliate links
     * - orders
     * - wallet ledger
     * - withdrawals
     */

    const [
      {
        data: links,
        error: linksError,
      },
      {
        data: orders,
        error: ordersError,
      },
      {
        data: ledger,
        error: ledgerError,
      },
      {
        data: withdrawals,
        error: withdrawalsError,
      },
    ] = await Promise.all([
      supabaseAdmin
        .from("affiliate_links")
        .select(`
          id,
          user_id,
          platform,
          clicks
        `)
        .in("user_id", userIds),

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
        .in("user_id", userIds),

      supabaseAdmin
        .from("wallet_ledger")
        .select(`
          id,
          user_id,
          type,
          amount
        `)
        .in("user_id", userIds),

      supabaseAdmin
        .from("withdrawals")
        .select(`
          id,
          user_id,
          amount,
          status
        `)
        .in("user_id", userIds),
    ]);

    if (linksError) {
      throw new Error(
        `affiliate_links: ${linksError.message}`
      );
    }

    if (ordersError) {
      throw new Error(
        `orders: ${ordersError.message}`
      );
    }

    if (ledgerError) {
      throw new Error(
        `wallet_ledger: ${ledgerError.message}`
      );
    }

    if (withdrawalsError) {
      throw new Error(
        `withdrawals: ${withdrawalsError.message}`
      );
    }

    const allLinks = links ?? [];
    const allOrders = orders ?? [];
    const allLedger = ledger ?? [];
    const allWithdrawals =
      withdrawals ?? [];

    /*
     * =========================
     * GROUP DATA BY USER
     * =========================
     *
     * Dùng Map thay vì filter toàn bộ
     * bảng nhiều lần cho từng user.
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

    for (const item of allLinks) {
      const rows =
        linksByUser.get(item.user_id) ?? [];

      rows.push(item);

      linksByUser.set(
        item.user_id,
        rows
      );
    }

    for (const item of allOrders) {
      const rows =
        ordersByUser.get(item.user_id) ?? [];

      rows.push(item);

      ordersByUser.set(
        item.user_id,
        rows
      );
    }

    for (const item of allLedger) {
      const rows =
        ledgerByUser.get(item.user_id) ?? [];

      rows.push(item);

      ledgerByUser.set(
        item.user_id,
        rows
      );
    }

    for (const item of allWithdrawals) {
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
     * =========================
     * BUILD USER STATS
     * =========================
     */

    const users = allProfiles.map(
      (profile) => {
        const userLinks =
          linksByUser.get(profile.id) ?? [];

        const userOrders =
          ordersByUser.get(profile.id) ?? [];

        const userLedger =
          ledgerByUser.get(profile.id) ?? [];

        const userWithdrawals =
          withdrawalsByUser.get(
            profile.id
          ) ?? [];

        /*
         * Approved + paid được tính là
         * đơn hợp lệ về mặt báo cáo.
         */

        const approvedOrders =
          userOrders.filter(
            (order) =>
              order.status === "approved" ||
              order.status === "paid"
          );

        const rejectedOrders =
          userOrders.filter(
            (order) =>
              order.status === "rejected"
          );

        /*
         * Số dư ví thực tế:
         * tổng wallet_ledger.
         *
         * cashback_reversal / withdrawal
         * đã là số âm nên cộng trực tiếp.
         */

        const walletBalance: number =
          sum(
            userLedger.map(
              (entry) => entry.amount
            )
          );

        /*
         * Withdrawal requested/processing
         * đang được giữ chỗ.
         */

        const reservedWithdrawal: number =
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
                (item) => item.amount
              )
          );

        const availableBalance: number =
          walletBalance -
          reservedWithdrawal;

        /*
         * Đếm đơn theo sàn
         */

        const platformOrders = {
          shopee:
            userOrders.filter(
              (item) =>
                item.platform === "shopee"
            ).length,

          lazada:
            userOrders.filter(
              (item) =>
                item.platform === "lazada"
            ).length,

          tiktok:
            userOrders.filter(
              (item) =>
                item.platform === "tiktok"
            ).length,
        };

        const totalOrderValue: number =
          sum(
            approvedOrders.map(
              (order) =>
                order.order_value
            )
          );

        const totalCashback: number =
          sum(
            approvedOrders.map(
              (order) =>
                order.cashback
            )
          );

        const totalClicks: number =
          sum(
            userLinks.map(
              (link) => link.clicks
            )
          );

        return {
          id: profile.id,

          full_name:
            profile.full_name || "",

          phone:
            profile.phone || "",

          role:
            profile.role || "user",

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
           * Không trả số tài khoản đầy đủ
           * về client Admin Users.
           */

          bank: {
            configured: Boolean(
              profile.bank_name &&
                profile.bank_account_number &&
                profile.bank_account_name
            ),

            bank_name:
              profile.bank_name || "",

            account_number_masked:
              maskAccount(
                profile.bank_account_number
              ),

            account_name:
              profile.bank_account_name || "",
          },
        };
      }
    );

    /*
     * =========================
     * SEARCH
     * =========================
     */

    const normalizedSearch =
      search.toLowerCase();

    const filteredUsers =
      normalizedSearch
        ? users.filter((user) => {
            return (
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
            );
          })
        : users;

    /*
     * =========================
     * SORT
     * =========================
     *
     * Ưu tiên user có tổng giá trị
     * đơn approved/paid cao nhất.
     *
     * Nếu bằng nhau:
     * user mới hơn đứng trước.
     */

    filteredUsers.sort((a, b) => {
      const valueDiff: number =
        b.total_order_value -
        a.total_order_value;

      if (valueDiff !== 0) {
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
    });

    /*
     * =========================
     * PAGINATION
     * =========================
     */

    const total =
      filteredUsers.length;

    const totalPages =
      Math.max(
        1,
        Math.ceil(
          total / PAGE_SIZE
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
     * =========================
     * RESPONSE
     * =========================
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
    console.error(
      "ADMIN USERS ERROR:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unknown error";

    const lowerMessage =
      message.toLowerCase();

    if (
      lowerMessage.includes(
        "unauthorized"
      ) ||
      lowerMessage.includes(
        "forbidden"
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: message,
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
