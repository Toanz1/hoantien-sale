"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type LinkItem = {
  id: string;
  user_id: string;
  platform: string;
  original_url: string;
  affiliate_url: string;
  tracking_id: string;
  clicks: number;
  created_at: string;

  user: {
    full_name: string;
    phone: string;
  };
};

type LinksResponse = {
  success: boolean;

  links: LinkItem[];

  summary: {
    total: number;
    totalClicks: number;
    platformCounts: {
      shopee: number;
      lazada: number;
      tiktok: number;
    };
  };

  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };

  error?: string;
};

function number(
  value: number | null | undefined
) {
  return new Intl.NumberFormat(
    "vi-VN"
  ).format(Number(value ?? 0));
}

function formatDate(
  value: string
) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "vi-VN",
    {
      dateStyle: "short",
      timeStyle: "short",
    }
  ).format(new Date(value));
}

function platformLabel(
  platform: string
) {
  switch (platform) {
    case "shopee":
      return "Shopee";

    case "lazada":
      return "Lazada";

    case "tiktok":
      return "TikTok Shop";

    default:
      return platform;
  }
}

export default function AdminLinksPage() {
  const supabase = createClient();

  const [data, setData] =
    useState<LinksResponse | null>(
      null
    );

  const [searchInput, setSearchInput] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [platform, setPlatform] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadLinks() {
    try {
      setLoading(true);
      setError("");

      const {
        data: sessionData,
      } =
        await supabase.auth.getSession();

      const accessToken =
        sessionData.session
          ?.access_token;

      if (!accessToken) {
        window.location.href =
          "/login";
        return;
      }

      const params =
        new URLSearchParams();

      params.set(
        "page",
        String(page)
      );

      if (search) {
        params.set(
          "search",
          search
        );
      }

      if (platform) {
        params.set(
          "platform",
          platform
        );
      }

      const response =
        await fetch(
          `/api/admin/links?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

      const responseText =
        await response.text();

      let json: LinksResponse;

      try {
        json =
          JSON.parse(
            responseText
          );
      } catch {
        console.error(
          "ADMIN LINKS NON-JSON:",
          response.status,
          responseText
        );

        throw new Error(
          `API trả về HTTP ${response.status} nhưng không phải JSON.`
        );
      }

      if (
        !response.ok ||
        !json.success
      ) {
        throw new Error(
          json.error ||
            "Không thể tải affiliate links."
        );
      }

      setData(json);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Có lỗi xảy ra."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLinks();
  }, [search, platform, page]);

  function submitSearch(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setPage(1);
    setSearch(
      searchInput.trim()
    );
  }

  function clearFilter() {
    setSearchInput("");
    setSearch("");
    setPlatform("");
    setPage(1);
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-5 py-8">
        {/* HEADER */}

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 text-sm font-semibold text-gray-500">
              HOÀN TIỀN SĂN SALE
            </div>

            <h1 className="text-3xl font-black tracking-tight">
              Quản lý Affiliate Links
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Theo dõi link affiliate,
              tracking và lượt click.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/admin"
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
            >
              ← Dashboard
            </Link>

            <Link
              href="/admin/users"
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
            >
              Người dùng
            </Link>

            <Link
              href="/admin/orders"
              className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Đơn hàng
            </Link>
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="font-bold">
              Không tải được Affiliate Links
            </div>

            <div className="mt-1">
              {error}
            </div>
          </div>
        )}

        {/* FILTER */}

        <section className="mb-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <form
            onSubmit={
              submitSearch
            }
            className="flex flex-col gap-3 lg:flex-row"
          >
            <input
              value={
                searchInput
              }
              onChange={(event) =>
                setSearchInput(
                  event.target.value
                )
              }
              placeholder="Tìm tracking ID, URL, User ID, tên hoặc SĐT..."
              className="h-11 min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none transition focus:border-black focus:bg-white"
            />

            <select
              value={platform}
              onChange={(event) => {
                setPlatform(
                  event.target.value
                );
                setPage(1);
              }}
              className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-black"
            >
              <option value="">
                Tất cả platform
              </option>

              <option value="shopee">
                Shopee
              </option>

              <option value="lazada">
                Lazada
              </option>

              <option value="tiktok">
                TikTok Shop
              </option>
            </select>

            <button
              type="submit"
              className="h-11 rounded-xl bg-black px-6 text-sm font-bold text-white hover:bg-gray-800"
            >
              Tìm
            </button>

            <button
              type="button"
              onClick={
                clearFilter
              }
              className="h-11 rounded-xl border border-gray-200 bg-white px-6 text-sm font-semibold hover:bg-gray-50"
            >
              Xóa lọc
            </button>
          </form>
        </section>

        {/* SUMMARY */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase text-gray-500">
              Tổng links
            </div>

            <div className="mt-2 text-2xl font-black">
              {number(
                data?.summary.total ??
                  0
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase text-gray-500">
              Tổng clicks
            </div>

            <div className="mt-2 text-2xl font-black">
              {number(
                data?.summary
                  .totalClicks ?? 0
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase text-gray-500">
              Shopee
            </div>

            <div className="mt-2 text-2xl font-black">
              {number(
                data?.summary
                  .platformCounts
                  .shopee ?? 0
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase text-gray-500">
              Lazada
            </div>

            <div className="mt-2 text-2xl font-black">
              {number(
                data?.summary
                  .platformCounts
                  .lazada ?? 0
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase text-gray-500">
              TikTok Shop
            </div>

            <div className="mt-2 text-2xl font-black">
              {number(
                data?.summary
                  .platformCounts
                  .tiktok ?? 0
              )}
            </div>
          </div>
        </div>

        {/* RESULT */}

        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {loading
              ? "Đang tải..."
              : `Tìm thấy ${number(
                  data?.pagination
                    .total ?? 0
                )} affiliate links`}
          </div>

          {data && (
            <div className="text-xs text-gray-400">
              Trang{" "}
              {data.pagination.page}{" "}
              /{" "}
              {
                data.pagination
                  .totalPages
              }
            </div>
          )}
        </div>

        {/* TABLE */}

        <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1350px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-4">
                    Tracking
                  </th>

                  <th className="px-5 py-4">
                    User
                  </th>

                  <th className="px-5 py-4">
                    Platform
                  </th>

                  <th className="px-5 py-4">
                    Link gốc
                  </th>

                  <th className="px-5 py-4">
                    Affiliate URL
                  </th>

                  <th className="px-5 py-4">
                    Clicks
                  </th>

                  <th className="px-5 py-4">
                    Ngày tạo
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-16 text-center text-gray-400"
                    >
                      Đang tải affiliate links...
                    </td>
                  </tr>
                ) : !data ||
                  data.links
                    .length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-16 text-center"
                    >
                      <div className="font-semibold text-gray-500">
                        Không tìm thấy affiliate link
                      </div>

                      <div className="mt-1 text-sm text-gray-400">
                        Thử lại với bộ lọc khác.
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.links.map(
                    (link) => (
                      <tr
                        key={link.id}
                        className="transition hover:bg-gray-50"
                      >
                        {/* TRACKING */}

                        <td className="px-5 py-5">
                          <div className="font-mono text-xs font-bold">
                            {link.tracking_id}
                          </div>

                          <div className="mt-1 font-mono text-[10px] text-gray-400">
                            {link.id.slice(
                              0,
                              12
                            )}
                            ...
                          </div>
                        </td>

                        {/* USER */}

                        <td className="px-5 py-5">
                          <div className="font-semibold">
                            {link.user
                              .full_name ||
                              "Chưa cập nhật tên"}
                          </div>

                          <div className="mt-1 font-mono text-[11px] text-gray-400">
                            {link.user_id.slice(
                              0,
                              12
                            )}
                            ...
                          </div>

                          {link.user
                            .phone && (
                            <div className="mt-1 text-xs text-gray-400">
                              {
                                link.user
                                  .phone
                              }
                            </div>
                          )}
                        </td>

                        {/* PLATFORM */}

                        <td className="px-5 py-5">
                          <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">
                            {platformLabel(
                              link.platform
                            )}
                          </span>
                        </td>

                        {/* ORIGINAL URL */}

                        <td className="max-w-[280px] px-5 py-5">
                          <div
                            title={
                              link.original_url
                            }
                            className="truncate text-xs text-gray-600"
                          >
                            {
                              link.original_url
                            }
                          </div>
                        </td>

                        {/* AFFILIATE URL */}

                        <td className="max-w-[280px] px-5 py-5">
                          <div
                            title={
                              link.affiliate_url
                            }
                            className="truncate text-xs text-gray-600"
                          >
                            {
                              link.affiliate_url
                            }
                          </div>
                        </td>

                        {/* CLICKS */}

                        <td className="px-5 py-5">
                          <div className="font-bold">
                            {number(
                              link.clicks
                            )}
                          </div>
                        </td>

                        {/* DATE */}

                        <td className="whitespace-nowrap px-5 py-5 text-xs text-gray-500">
                          {formatDate(
                            link.created_at
                          )}
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}

          {data &&
            data.pagination
              .totalPages > 1 && (
              <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-gray-400">
                  Hiển thị{" "}
                  {data.links.length}{" "}
                  /{" "}
                  {number(
                    data.pagination
                      .total
                  )}{" "}
                  links
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={
                      page <= 1 ||
                      loading
                    }
                    onClick={() =>
                      setPage(
                        (current) =>
                          Math.max(
                            1,
                            current -
                              1
                          )
                      )
                    }
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ← Trước
                  </button>

                  <div className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-bold">
                    {page}
                  </div>

                  <button
                    disabled={
                      page >=
                        data
                          .pagination
                          .totalPages ||
                      loading
                    }
                    onClick={() =>
                      setPage(
                        (current) =>
                          Math.min(
                            data
                              .pagination
                              .totalPages,
                            current +
                              1
                          )
                      )
                    }
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Sau →
                  </button>
                </div>
              </div>
            )}
        </section>
      </div>
    </main>
  );
}