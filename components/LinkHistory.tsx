"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AffiliateLink = {
  id: string;
  platform: string;
  original_url: string;
  affiliate_url: string | null;
  tracking_id: string;
  clicks: number;
  created_at: string;
};

export default function LinkHistory() {
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const supabase = createClient();

  async function loadLinks() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Bạn cần đăng nhập để xem lịch sử.");
        return;
      }

      const { data, error } = await supabase
        .from("affiliate_links")
        .select(
          "id, platform, original_url, affiliate_url, tracking_id, clicks, created_at"
        )
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        })
        .limit(50);

      if (error) {
        console.error(
          "Load affiliate links error:",
          error
        );

        setError(
          "Không thể tải lịch sử link."
        );

        return;
      }

      setLinks(data ?? []);
    } catch (err) {
      console.error(err);

      setError(
        "Có lỗi khi tải lịch sử link."
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyLink(
    link: AffiliateLink
  ) {
    if (!link.affiliate_url) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        link.affiliate_url
      );

      setCopiedId(link.id);

      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (err) {
      console.error(
        "Copy affiliate link error:",
        err
      );
    }
  }

  useEffect(() => {
    loadLinks();
  }, []);

  if (loading) {
    return (
      <div className="mt-8 rounded-3xl border bg-white p-6 shadow-xl">
        <div className="text-sm text-gray-500">
          Đang tải lịch sử link...
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-3xl border bg-white p-5 shadow-xl md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">
            Lịch sử link
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Những link Affiliate bạn đã tạo
          </p>
        </div>

        <button
          onClick={loadLinks}
          className="rounded-xl border px-4 py-2 text-sm font-semibold transition hover:bg-gray-50"
        >
          Làm mới
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Empty */}
      {!error && links.length === 0 && (
        <div className="mt-6 rounded-2xl bg-gray-50 p-8 text-center">
          <div className="font-semibold">
            Chưa có link nào
          </div>

          <div className="mt-1 text-sm text-gray-500">
            Link Affiliate bạn tạo sẽ xuất hiện
            ở đây.
          </div>
        </div>
      )}

      {/* List */}
      {links.length > 0 && (
        <div className="mt-6 space-y-4">
          {links.map((link) => (
            <div
              key={link.id}
              className="rounded-2xl border bg-gray-50 p-4"
            >
              {/* Top */}
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-white px-3 py-1 text-xs font-bold uppercase">
                    {link.platform}
                  </span>

                  <span className="text-xs text-gray-500">
                    {formatDate(
                      link.created_at
                    )}
                  </span>
                </div>

                <span className="text-xs text-gray-500">
                  Click: {link.clicks ?? 0}
                </span>
              </div>

              {/* Original URL */}
              <div className="mt-4">
                <div className="text-xs font-semibold text-gray-500">
                  Link sản phẩm
                </div>

                <div className="mt-1 break-all text-sm">
                  {link.original_url}
                </div>
              </div>

              {/* Tracking */}
              <div className="mt-4">
                <div className="text-xs font-semibold text-gray-500">
                  Tracking ID
                </div>

                <div className="mt-1 break-all font-mono text-xs">
                  {link.tracking_id}
                </div>
              </div>

              {/* Actions */}
              {link.affiliate_url && (
                <div className="mt-4">
                  <button
                    onClick={() =>
                      copyLink(link)
                    }
                    className="rounded-xl bg-black px-4 py-2 text-sm font-bold text-white transition hover:bg-gray-800"
                  >
                    {copiedId === link.id
                      ? "✓ Đã sao chép"
                      : "Sao chép link Affiliate"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(
  value: string
) {
  try {
    return new Intl.DateTimeFormat(
      "vi-VN",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(new Date(value));
  } catch {
    return value;
  }
}