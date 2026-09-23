"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
};

type PreviewResponse = {
  success: boolean;
  error?: string;
  summary?: {
    csv_rows: number;
    orders: number;
    matched: number;
    unmatched: number;
    total_order_value: number;
    total_commission: number;
    total_cashback: number;
    cashback_rate: number;
  };
  orders?: PreviewOrder[];
};

type ImportResponse = {
  success: boolean;
  error?: string;
  summary?: {
    csv_rows: number;
    orders: number;
    imported: number;
    skipped: number;
    wallet_credited: number;
    already_credited: number;
    errors: number;
  };
  errors?: Array<{
    external_order_id: string;
    error: string;
  }>;
};

function formatMoney(value: number) {
  return Math.round(value).toLocaleString("de-DE");
}

function getStatusLabel(
  status: PreviewOrder["status"]
) {
  if (status === "approved") {
    return "Đã duyệt";
  }

  if (status === "rejected") {
    return "Đã hủy";
  }

  return "Đang chờ";
}

function getStatusClass(
  status: PreviewOrder["status"]
) {
  if (status === "approved") {
    return "bg-green-100 text-green-700";
  }

  if (status === "rejected") {
    return "bg-red-100 text-red-700";
  }

  return "bg-yellow-100 text-yellow-700";
}

function getReasonLabel(
  reason: string | null
) {
  if (reason === "MISSING_TRACKING") {
    return "Không có tracking";
  }

  if (reason === "TRACKING_NOT_FOUND") {
    return "Tracking chưa tồn tại";
  }

  if (reason === "ORDER_USER_MISMATCH") {
    return "Order đã thuộc user khác";
  }

  return reason ?? "";
}

export default function ShopeeImportPage() {
  const supabase = createClient();

  const [file, setFile] =
    useState<File | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [importing, setImporting] =
    useState(false);

  const [preview, setPreview] =
    useState<PreviewResponse | null>(null);

  const [result, setResult] =
    useState<ImportResponse | null>(null);

  const [error, setError] =
    useState("");

  async function getAccessToken() {
    const {
      data,
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw new Error(
        sessionError.message
      );
    }

    const accessToken =
      data.session?.access_token;

    if (!accessToken) {
      throw new Error(
        "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
      );
    }

    return accessToken;
  }

  async function handlePreview() {
    if (!file) {
      setError(
        "Vui lòng chọn file CSV."
      );
      return;
    }

    setLoading(true);
    setError("");
    setPreview(null);
    setResult(null);

    try {
      const accessToken =
        await getAccessToken();

      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      const response =
        await fetch(
          "/api/admin/import/shopee",
          {
            method: "POST",
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
            },
            body: formData,
          }
        );

      const data =
        (await response.json()) as PreviewResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ??
            "Không thể preview CSV."
        );
      }

      setPreview(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Có lỗi xảy ra khi preview CSV."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    if (!file) {
      setError(
        "Vui lòng chọn file CSV."
      );
      return;
    }

    if (
      !preview?.success ||
      !preview.orders
    ) {
      setError(
        "Vui lòng Preview CSV trước khi Import."
      );
      return;
    }

    const matched =
      preview.summary?.matched ?? 0;

    /*
     * Không cho import nếu không có
     * bất kỳ order nào match tracking.
     */
    if (matched === 0) {
      setError(
        "Không có đơn nào match được tracking. Không thể import."
      );
      return;
    }

    setImporting(true);
    setError("");
    setResult(null);

    try {
      const accessToken =
        await getAccessToken();

      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      const response =
        await fetch(
          "/api/admin/import/shopee",
          {
            method: "PUT",
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
            },
            body: formData,
          }
        );

      const data =
        (await response.json()) as ImportResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ??
            "Không thể import CSV."
        );
      }

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Có lỗi xảy ra khi import CSV."
      );
    } finally {
      setImporting(false);
    }
  }

  function handleFileChange(
    selectedFile: File | null
  ) {
    setFile(selectedFile);
    setPreview(null);
    setResult(null);
    setError("");
  }

  const summary =
    preview?.summary;

  const importSummary =
    result?.summary;

  const matchedCount =
    summary?.matched ?? 0;

  const unmatchedCount =
    summary?.unmatched ?? 0;

  const canImport =
    Boolean(
      preview?.success &&
      preview.orders?.length &&
      matchedCount > 0 &&
      !importing
    );

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-5 py-10">

        {/* HEADER */}
        <div className="mb-8">
          <div className="mb-2 text-sm font-semibold text-orange-600">
            ADMIN / IMPORT
          </div>

          <h1 className="text-3xl font-black tracking-tight text-gray-900">
            Import đơn hàng Shopee
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-gray-600">
            Upload Shopee Affiliate Commission
            Report để đối soát đơn hàng,
            tracking user và cộng cashback.
          </p>
        </div>

        {/* UPLOAD CARD */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <label
                htmlFor="shopee-file"
                className="mb-2 block text-sm font-semibold text-gray-800"
              >
                File Shopee CSV
              </label>

              <input
                id="shopee-file"
                type="file"
                accept=".csv,text/csv"
                onChange={(event) =>
                  handleFileChange(
                    event.target.files?.[0] ??
                      null
                  )
                }
                className="block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm"
              />

              {file && (
                <div className="mt-2 text-sm text-gray-500">
                  Đã chọn:{" "}
                  <span className="font-medium text-gray-800">
                    {file.name}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handlePreview}
              disabled={
                !file ||
                loading ||
                importing
              }
              className="rounded-xl bg-black px-6 py-3 text-sm font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading
                ? "Đang đọc CSV..."
                : "Preview CSV"}
            </button>
          </div>

          <div className="mt-5 rounded-xl bg-orange-50 p-4 text-sm text-orange-800">
            <div className="font-bold">
              Lưu ý
            </div>

            <div className="mt-1">
              File cần là báo cáo{" "}
              <b>
                Shopee Affiliate Commission
                Report
              </b>
              . Tracking sẽ được tìm từ{" "}
              <b>Sub_id</b>,{" "}
              <b>Sub_id1</b> hoặc{" "}
              <b>UTM Content</b>.
            </div>

            <div className="mt-2 text-xs text-orange-700">
              Chỉ order match chính xác với
              tracking trong hệ thống mới được
              import và cộng cashback.
            </div>
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="font-bold">
              Có lỗi
            </div>

            <div className="mt-1">
              {error}
            </div>
          </div>
        )}

        {/* PREVIEW SUMMARY */}
        {summary && (
          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <SummaryCard
              label="CSV rows"
              value={formatMoney(
                summary.csv_rows
              )}
            />

            <SummaryCard
              label="Orders"
              value={formatMoney(
                summary.orders
              )}
            />

            <SummaryCard
              label="Matched"
              value={formatMoney(
                summary.matched
              )}
              valueClassName="text-green-600"
            />

            <SummaryCard
              label="Unmatched"
              value={formatMoney(
                summary.unmatched
              )}
              valueClassName={
                summary.unmatched > 0
                  ? "text-red-600"
                  : "text-gray-900"
              }
            />

            <SummaryCard
              label="Cashback"
              value={`${formatMoney(
                summary.total_cashback
              )} ₫`}
              valueClassName="text-orange-600"
            />
          </section>
        )}

        {/* PREVIEW MONEY */}
        {summary && (
          <section className="mt-4 grid gap-4 md:grid-cols-3">
            <SummaryCard
              label="Tổng giá trị đơn"
              value={`${formatMoney(
                summary.total_order_value
              )} ₫`}
            />

            <SummaryCard
              label="Tổng hoa hồng"
              value={`${formatMoney(
                summary.total_commission
              )} ₫`}
            />

            <SummaryCard
              label="Tỷ lệ cashback"
              value={`${Math.round(
                summary.cashback_rate * 100
              )}%`}
            />
          </section>
        )}

        {/* IMPORT CARD */}
        {preview?.success && (
          <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-bold text-gray-900">
                  {matchedCount > 0
                    ? "Sẵn sàng import"
                    : "Chưa thể import"}
                </h2>

                {matchedCount > 0 ? (
                  <div className="mt-1 text-sm text-gray-500">
                    Có{" "}
                    <span className="font-bold text-green-600">
                      {matchedCount}
                    </span>{" "}
                    order match tracking.

                    {unmatchedCount > 0 && (
                      <>
                        {" "}
                        Có{" "}
                        <span className="font-bold text-red-600">
                          {unmatchedCount}
                        </span>{" "}
                        order chưa match và sẽ
                        không được import.
                      </>
                    )}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-red-600">
                    Không có order nào match
                    được tracking. Hệ thống sẽ
                    không cho import.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleImport}
                disabled={!canImport}
                className="rounded-xl bg-orange-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {importing
                  ? "Đang import..."
                  : matchedCount === 0
                    ? "Chưa có đơn match"
                    : `Import ${matchedCount} đơn`}
              </button>
            </div>
          </section>
        )}

        {/* IMPORT RESULT */}
        {importSummary && (
          <section className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-6">
            <h2 className="text-lg font-black text-green-800">
              Import hoàn tất
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <ResultCard
                label="Imported"
                value={
                  importSummary.imported
                }
              />

              <ResultCard
                label="Skipped"
                value={
                  importSummary.skipped
                }
              />

              <ResultCard
                label="Đã cộng ví"
                value={
                  importSummary.wallet_credited
                }
              />

              <ResultCard
                label="Đã có cashback"
                value={
                  importSummary.already_credited
                }
              />

              <ResultCard
                label="Errors"
                value={
                  importSummary.errors
                }
              />
            </div>
          </section>
        )}

        {/* PREVIEW TABLE */}
        {preview?.orders &&
          preview.orders.length > 0 && (
            <section className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-5">
                <h2 className="font-black text-gray-900">
                  Preview orders
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {preview.orders.length} đơn
                  được phát hiện trong file.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[1100px] w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-5 py-3">
                        Order ID
                      </th>

                      <th className="px-5 py-3">
                        Tracking
                      </th>

                      <th className="px-5 py-3">
                        User
                      </th>

                      <th className="px-5 py-3">
                        Product
                      </th>

                      <th className="px-5 py-3 text-right">
                        Order value
                      </th>

                      <th className="px-5 py-3 text-right">
                        Commission
                      </th>

                      <th className="px-5 py-3 text-right">
                        Cashback
                      </th>

                      <th className="px-5 py-3">
                        Status
                      </th>

                      <th className="px-5 py-3">
                        Match
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {preview.orders.map(
                      (order) => (
                        <tr
                          key={
                            order.external_order_id
                          }
                          className="hover:bg-gray-50"
                        >
                          <td className="px-5 py-4">
                            <div className="font-semibold text-gray-900">
                              {
                                order.external_order_id
                              }
                            </div>

                            {order.row_count >
                              1 && (
                              <div className="mt-1 text-xs text-gray-400">
                                {
                                  order.row_count
                                }{" "}
                                dòng item
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            {order.tracking_id ? (
                              <code className="rounded bg-gray-100 px-2 py-1 text-xs">
                                {
                                  order.tracking_id
                                }
                              </code>
                            ) : (
                              <span className="text-gray-400">
                                —
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            {order.user_id ? (
                              <code className="text-xs text-gray-600">
                                {
                                  order.user_id
                                }
                              </code>
                            ) : (
                              <span className="text-red-500">
                                —
                              </span>
                            )}
                          </td>

                          <td className="max-w-[280px] px-5 py-4">
                            <div className="truncate font-medium text-gray-800">
                              {
                                order.product_name
                              }
                            </div>
                          </td>

                          <td className="px-5 py-4 text-right font-medium">
                            {formatMoney(
                              order.order_value
                            )}{" "}
                            ₫
                          </td>

                          <td className="px-5 py-4 text-right">
                            {formatMoney(
                              order.commission
                            )}{" "}
                            ₫
                          </td>

                          <td className="px-5 py-4 text-right font-bold text-orange-600">
                            {formatMoney(
                              order.cashback
                            )}{" "}
                            ₫
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                                order.status
                              )}`}
                            >
                              {getStatusLabel(
                                order.status
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            {order.matched ? (
                              <span className="font-bold text-green-600">
                                ✓ Match
                              </span>
                            ) : (
                              <div>
                                <span className="font-bold text-red-600">
                                  ✕ Không match
                                </span>

                                {order.reason && (
                                  <div className="mt-1 text-xs text-red-500">
                                    {getReasonLabel(
                                      order.reason
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

        {/* IMPORT ERRORS */}
        {result?.errors &&
          result.errors.length > 0 && (
            <section className="mt-6 rounded-2xl border border-red-200 bg-white shadow-sm">
              <div className="border-b border-red-100 bg-red-50 px-6 py-4">
                <h2 className="font-black text-red-800">
                  Chi tiết lỗi
                </h2>
              </div>

              <div className="divide-y divide-gray-100">
                {result.errors.map(
                  (item, index) => (
                    <div
                      key={`${item.external_order_id}-${index}`}
                      className="px-6 py-4"
                    >
                      <div className="font-semibold text-gray-900">
                        {
                          item.external_order_id
                        }
                      </div>

                      <div className="mt-1 text-sm text-red-600">
                        {item.error}
                      </div>
                    </div>
                  )
                )}
              </div>
            </section>
          )}
      </div>
    </main>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function SummaryCard({
  label,
  value,
  valueClassName = "text-gray-900",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </div>

      <div
        className={`mt-2 text-2xl font-black ${valueClassName}`}
      >
        {value}
      </div>
    </div>
  );
}

function ResultCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-green-200 bg-white p-4">
      <div className="text-xs font-semibold uppercase text-gray-500">
        {label}
      </div>

      <div className="mt-1 text-2xl font-black text-gray-900">
        {formatMoney(value)}
      </div>
    </div>
  );
}