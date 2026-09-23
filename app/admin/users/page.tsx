"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type User = {
  id: string;
  full_name: string;
  phone: string;
  role: string;
  created_at: string | null;
  affiliate_links: number;
  total_clicks: number;
  orders: number;
  approved_orders: number;
  rejected_orders: number;
  platform_orders: {
    shopee: number;
    lazada: number;
    tiktok: number;
  };
  total_order_value: number;
  total_cashback: number;
  wallet_balance: number;
  reserved_withdrawal: number;
  available_balance: number;
  bank: {
    configured: boolean;
    bank_name: string;
    account_number_masked: string;
    account_name: string;
  };
};

type UsersResponse = {
  success: boolean;
  users: User[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  error?: string;
};

function money(value: number | null | undefined) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function number(value: number | null | undefined) {
  return new Intl.NumberFormat("vi-VN").format(Number(value ?? 0));
}

function date(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AdminUsersPage() {
  const supabase = useMemo(() => createClient(), []);

  const [data, setData] = useState<UsersResponse | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        window.location.href = "/login";
        return;
      }

      const params = new URLSearchParams({
        page: String(page),
      });

      if (search) params.set("search", search);

      const response = await fetch(
        `/api/admin/users?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        }
      );

      const responseText = await response.text();

      let json: UsersResponse;

      try {
        json = JSON.parse(responseText);
      } catch {
        console.error(
          "ADMIN USERS NON-JSON:",
          response.status,
          responseText
        );
        throw new Error(
          `API trả về HTTP ${response.status} nhưng không phải JSON.`
        );
      }

      if (!response.ok || !json.success) {
        throw new Error(json.error || "Không thể tải người dùng.");
      }

      setData(json);

      if (selectedUser) {
        const refreshed = json.users.find(
          (item) => item.id === selectedUser.id
        );
        if (refreshed) setSelectedUser(refreshed);
      }
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Có lỗi xảy ra."
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedUser, supabase]);

  useEffect(() => {
    loadUsers();
    // selectedUser intentionally omitted to avoid a refresh loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function clearSearch() {
    setSearchInput("");
    setSearch("");
    setPage(1);
  }

  const pageWallet =
    data?.users.reduce(
      (sum, user) => sum + Number(user.wallet_balance || 0),
      0
    ) ?? 0;

  const pageCashback =
    data?.users.reduce(
      (sum, user) => sum + Number(user.total_cashback || 0),
      0
    ) ?? 0;

  return (
    <main className="min-h-screen bg-[#f7f8fa]">
      <div className="mx-auto max-w-7xl px-5 py-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 text-sm font-semibold text-emerald-600">
              HOÀN TIỀN SĂN SALE
            </div>
            <h1 className="text-3xl font-black tracking-tight">
              Admin Users Center
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Theo dõi người dùng, đơn hàng, cashback và số dư ví.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/admin"
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
            >
              ← Admin
            </Link>

            <Link
              href="/admin/orders"
              className="rounded-xl bg-gray-950 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Đơn hàng
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="font-bold">Không tải được người dùng</div>
            <div className="mt-1">{error}</div>
          </div>
        )}

        <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Người dùng"
            value={loading ? "..." : number(data?.pagination.total ?? 0)}
          />
          <SummaryCard
            label="Đang hiển thị"
            value={number(data?.users.length ?? 0)}
          />
          <SummaryCard
            label="Cashback trang này"
            value={money(pageCashback)}
          />
          <SummaryCard
            label="Số dư ví trang này"
            value={money(pageWallet)}
          />
        </section>

        <section className="mb-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <form
            onSubmit={submitSearch}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Tìm User ID, họ tên hoặc số điện thoại..."
              className="h-11 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none transition focus:border-emerald-500 focus:bg-white"
            />

            <button
              type="submit"
              className="h-11 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white hover:bg-emerald-700"
            >
              Tìm
            </button>

            <button
              type="button"
              onClick={clearSearch}
              className="h-11 rounded-xl border border-gray-200 bg-white px-6 text-sm font-semibold hover:bg-gray-50"
            >
              Xóa
            </button>
          </form>
        </section>

        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="text-sm text-gray-500">
            {loading
              ? "Đang tải..."
              : `Tìm thấy ${number(
                  data?.pagination.total ?? 0
                )} người dùng`}
          </div>

          <button
            type="button"
            onClick={() => loadUsers()}
            disabled={loading}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? "Đang tải..." : "Làm mới"}
          </button>
        </div>

        <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-4">Người dùng</th>
                  <th className="px-5 py-4">Affiliate</th>
                  <th className="px-5 py-4">Đơn hàng</th>
                  <th className="px-5 py-4">Tài chính</th>
                  <th className="px-5 py-4">Ngân hàng</th>
                  <th className="px-5 py-4 text-right">Xem</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-16 text-center text-gray-400"
                    >
                      Đang tải người dùng...
                    </td>
                  </tr>
                ) : !data || data.users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-16 text-center"
                    >
                      <div className="font-semibold text-gray-500">
                        Không tìm thấy người dùng
                      </div>
                      <div className="mt-1 text-sm text-gray-400">
                        Thử lại với từ khóa khác.
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.users.map((user) => (
                    <tr
                      key={user.id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-5 py-5">
                        <div className="font-bold">
                          {user.full_name || "Chưa cập nhật tên"}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {user.phone || "Chưa cập nhật SĐT"}
                        </div>
                        <div className="mt-1 font-mono text-[11px] text-gray-400">
                          {user.id.slice(0, 12)}...
                        </div>
                      </td>

                      <td className="px-5 py-5">
                        <div className="font-bold">
                          {number(user.affiliate_links)} link
                        </div>
                        <div className="mt-1 text-xs text-gray-400">
                          {number(user.total_clicks)} lượt click
                        </div>
                      </td>

                      <td className="px-5 py-5">
                        <div className="font-bold">
                          {number(user.orders)} đơn
                        </div>
                        <div className="mt-1 text-xs text-gray-400">
                          {number(user.approved_orders)} đã duyệt ·{" "}
                          {number(user.rejected_orders)} từ chối
                        </div>
                      </td>

                      <td className="px-5 py-5">
                        <div className="text-xs text-gray-400">
                          Giá trị đơn
                        </div>
                        <div className="font-bold">
                          {money(user.total_order_value)}
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                          Cashback / Ví
                        </div>
                        <div className="font-bold text-emerald-600">
                          {money(user.total_cashback)} /{" "}
                          {money(user.wallet_balance)}
                        </div>
                      </td>

                      <td className="px-5 py-5">
                        {user.bank.configured ? (
                          <>
                            <div className="font-semibold">
                              {user.bank.bank_name}
                            </div>
                            <div className="mt-1 font-mono text-xs text-gray-400">
                              {user.bank.account_number_masked}
                            </div>
                          </>
                        ) : (
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            Chưa thiết lập
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedUser(user)}
                          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold hover:bg-gray-50"
                        >
                          Xem
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {data && data.pagination.totalPages > 1 && (
            <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-gray-400">
                Hiển thị {data.users.length} /{" "}
                {number(data.pagination.total)} người dùng
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1 || loading}
                  onClick={() =>
                    setPage((current) => Math.max(1, current - 1))
                  }
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-40"
                >
                  ← Trước
                </button>

                <div className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-bold">
                  {data.pagination.page} / {data.pagination.totalPages}
                </div>

                <button
                  disabled={
                    page >= data.pagination.totalPages || loading
                  }
                  onClick={() =>
                    setPage((current) =>
                      Math.min(
                        data.pagination.totalPages,
                        current + 1
                      )
                    )
                  }
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-40"
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </main>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className="mt-2 text-xl font-black text-gray-900">
        {value}
      </div>
    </div>
  );
}

function UserDetailModal({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-start justify-between gap-4 border-b bg-white px-6 py-5">
          <div>
            <div className="text-xs font-semibold uppercase text-emerald-600">
              Người dùng
            </div>
            <h2 className="mt-1 text-xl font-black">
              {user.full_name || "Chưa cập nhật tên"}
            </h2>
            <div className="mt-1 break-all font-mono text-xs text-gray-500">
              {user.id}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border px-3 py-2 text-sm font-bold hover:bg-gray-50"
          >
            Đóng
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <DetailCard label="Đơn hàng" value={number(user.orders)} />
            <DetailCard
              label="Đã duyệt"
              value={number(user.approved_orders)}
            />
            <DetailCard
              label="Cashback"
              value={money(user.total_cashback)}
            />
            <DetailCard
              label="Số dư ví"
              value={money(user.wallet_balance)}
            />
          </div>

          <section className="rounded-2xl bg-gray-50 p-5">
            <h3 className="mb-4 font-black">Tài khoản</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailRow label="Họ tên" value={user.full_name || "-"} />
              <DetailRow label="Số điện thoại" value={user.phone || "-"} />
              <DetailRow label="Vai trò" value={user.role || "user"} />
              <DetailRow label="Ngày tạo" value={date(user.created_at)} />
            </div>
          </section>

          <section className="rounded-2xl bg-gray-50 p-5">
            <h3 className="mb-4 font-black">Hoạt động</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <DetailRow
                label="Affiliate links"
                value={number(user.affiliate_links)}
              />
              <DetailRow
                label="Clicks"
                value={number(user.total_clicks)}
              />
              <DetailRow
                label="Giá trị đơn duyệt"
                value={money(user.total_order_value)}
              />
              <DetailRow
                label="Đơn theo sàn"
                value={`Shopee ${user.platform_orders.shopee} · Lazada ${user.platform_orders.lazada} · TikTok ${user.platform_orders.tiktok}`}
              />
            </div>
          </section>

          <section className="rounded-2xl bg-gray-50 p-5">
            <h3 className="mb-4 font-black">Ví & rút tiền</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <DetailRow
                label="Số dư ledger"
                value={money(user.wallet_balance)}
              />
              <DetailRow
                label="Đang giữ để rút"
                value={money(user.reserved_withdrawal)}
              />
              <DetailRow
                label="Khả dụng"
                value={money(user.available_balance)}
              />
            </div>
          </section>

          <section className="rounded-2xl bg-gray-50 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-black">Tài khoản ngân hàng</h3>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  user.bank.configured
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {user.bank.configured ? "Đã thiết lập" : "Chưa thiết lập"}
              </span>
            </div>

            {user.bank.configured ? (
              <div className="grid gap-4 sm:grid-cols-3">
                <DetailRow
                  label="Ngân hàng"
                  value={user.bank.bank_name || "-"}
                />
                <DetailRow
                  label="Số tài khoản"
                  value={user.bank.account_number_masked || "-"}
                  mono
                />
                <DetailRow
                  label="Chủ tài khoản"
                  value={user.bank.account_name || "-"}
                />
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                Người dùng chưa lưu đủ thông tin nhận tiền.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function DetailCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 font-black">{value}</div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-400">{label}</div>
      <div
        className={`mt-1 break-words text-sm font-semibold text-gray-800 ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
