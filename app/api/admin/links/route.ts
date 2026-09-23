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
      "ADMIN LINKS: Missing Supabase server environment variables"
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
 * GET /api/admin/links
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

    const platform =
      searchParams
        .get("platform")
        ?.trim()
        .toLowerCase() ?? "";

    const pageParam =
      Number(
        searchParams.get("page") ??
          "1"
      );

    const page =
      Number.isFinite(pageParam) &&
      pageParam > 0
        ? Math.floor(pageParam)
        : 1;

    /*
     * Chỉ chấp nhận platform
     * mà hệ thống hiện hỗ trợ.
     */
    const allowedPlatforms =
      new Set([
        "shopee",
        "lazada",
        "tiktok",
      ]);

    const platformFilter =
      allowedPlatforms.has(platform)
        ? platform
        : "";

    /*
     * =========================================
     * 3. LOAD LINKS
     * =========================================
     */

    const {
      data: links,
      error: linksError,
    } = await supabaseAdmin
      .from("affiliate_links")
      .select(`
        id,
        user_id,
        platform,
        original_url,
        affiliate_url,
        tracking_id,
        clicks,
        created_at
      `)
      .order("created_at", {
        ascending: false,
      });

    if (linksError) {
      console.error(
        "ADMIN LINKS affiliate_links:",
        linksError
      );

      throw new Error(
        "DATABASE_QUERY_ERROR"
      );
    }

    const allLinks =
      links ?? [];

    /*
     * =========================================
     * 4. LOAD PROFILES
     * =========================================
     */

    const userIds =
      Array.from(
        new Set(
          allLinks
            .map(
              (link) =>
                link.user_id
            )
            .filter(
              (
                userId
              ): userId is string =>
                typeof userId ===
                  "string" &&
                userId.length > 0
            )
        )
      );

    let profiles: Array<{
      id: string;
      full_name:
        | string
        | null;
      phone:
        | string
        | null;
    }> = [];

    if (userIds.length > 0) {
      const {
        data,
        error,
      } = await supabaseAdmin
        .from("profiles")
        .select(`
          id,
          full_name,
          phone
        `)
        .in("id", userIds);

      if (error) {
        console.error(
          "ADMIN LINKS profiles:",
          error
        );

        throw new Error(
          "DATABASE_QUERY_ERROR"
        );
      }

      profiles =
        data ?? [];
    }

    const profileMap =
      new Map(
        profiles.map(
          (profile) => [
            profile.id,
            profile,
          ]
        )
      );

    /*
     * =========================================
     * 5. BUILD DATA
     * =========================================
     */

    const normalizedSearch =
      search.toLowerCase();

    let filteredLinks =
      allLinks.map(
        (link) => {
          const profile =
            profileMap.get(
              link.user_id
            );

          return {
            id:
              link.id,

            user_id:
              link.user_id,

            platform:
              link.platform,

            original_url:
              link.original_url,

            affiliate_url:
              link.affiliate_url,

            tracking_id:
              link.tracking_id,

            clicks:
              Number(
                link.clicks ??
                  0
              ),

            created_at:
              link.created_at,

            user: {
              full_name:
                profile
                  ?.full_name ??
                "",

              phone:
                profile
                  ?.phone ??
                "",
            },
          };
        }
      );

    /*
     * =========================================
     * 6. SEARCH
     * =========================================
     */

    if (normalizedSearch) {
      filteredLinks =
        filteredLinks.filter(
          (link) => {
            const values = [
              link.tracking_id,
              link.original_url,
              link.affiliate_url,
              link.user_id,
              link.user.full_name,
              link.user.phone,
            ];

            return values.some(
              (value) =>
                String(
                  value ?? ""
                )
                  .toLowerCase()
                  .includes(
                    normalizedSearch
                  )
            );
          }
        );
    }

    /*
     * =========================================
     * 7. PLATFORM FILTER
     * =========================================
     */

    if (platformFilter) {
      filteredLinks =
        filteredLinks.filter(
          (link) =>
            link.platform ===
            platformFilter
        );
    }

    /*
     * =========================================
     * 8. SUMMARY
     * =========================================
     */

    const totalClicks =
      filteredLinks.reduce(
        (
          total,
          link
        ) => {
          const clicks =
            Number(
              link.clicks ??
                0
            );

          return (
            total +
            (Number.isFinite(
              clicks
            )
              ? clicks
              : 0)
          );
        },
        0
      );

    const platformCounts = {
      shopee: 0,
      lazada: 0,
      tiktok: 0,
    };

    for (
      const link of
      filteredLinks
    ) {
      if (
        link.platform ===
        "shopee"
      ) {
        platformCounts.shopee++;
      }

      if (
        link.platform ===
        "lazada"
      ) {
        platformCounts.lazada++;
      }

      if (
        link.platform ===
        "tiktok"
      ) {
        platformCounts.tiktok++;
      }
    }

    /*
     * =========================================
     * 9. PAGINATION
     * =========================================
     */

    const total =
      filteredLinks.length;

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

    const to =
      from +
      PAGE_SIZE;

    const paginatedLinks =
      filteredLinks.slice(
        from,
        to
      );

    /*
     * =========================================
     * 10. RESPONSE
     * =========================================
     */

    return NextResponse.json({
      success: true,

      links:
        paginatedLinks,

      summary: {
        total,
        totalClicks,
        platformCounts,
      },

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
      "ADMIN LINKS ERROR:",
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