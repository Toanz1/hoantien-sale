"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import HomeAuthNav from "@/components/HomeAuthNav";
import { createClient } from "@/lib/supabase/client";

type NotificationItem = {
  id: string;
  type?: string;
  category?: string;
  title: string;
  message?: string;
  description?: string;
  created_at?: string;
  date?: string;
  time?: string;
};

export default function NotificationsPage() {
  const [notifPermission, setNotifPermission] = useState<string>("default");
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState({
    title: "Chưa cho phép",
    desc: "Chọn Cho phép khi trình duyệt hỏi quyền thông báo.",
  });

  const [activeTab, setActiveTab] = useState<string>("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPermission(Notification.permission);
    }
    fetchNotifications();
  }, []);

  // Hàm tải danh sách thông báo từ Supabase
  async function fetchNotifications() {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Truy vấn bảng thông báo của người dùng
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Lỗi tải thông báo:", error);
      } else if (data) {
        setNotifications(data);
      }
    } catch (err) {
      console.error("Lỗi kết nối lấy thông báo:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleEnableNotifications = async () => {
    if (!("Notification" in window)) {
      alert("Trình duyệt của bạn không hỗ trợ thông báo đẩy.");
      return;
    }

    if (Notification.permission === "granted") {
      setModalMessage({
        title: "Đã bật thông báo",
        desc: "Trình duyệt của bạn đã cấp quyền nhận thông báo thành công!",
      });
      setShowModal(true);
      return;
    }

    if (Notification.permission === "denied") {
      setModalMessage({
        title: "Đang bị chặn thông báo",
        desc: "Bạn đã chặn thông báo trên trang này. Vui lòng bấm vào biểu tượng cài đặt ở thanh địa chỉ trình duyệt để cấp lại quyền.",
      });
      setShowModal(true);
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);

      if (permission === "granted") {
        setModalMessage({
          title: "Thành công",
          desc: "Bạn đã cho phép nhận thông báo từ hệ thống.",
        });
        setShowModal(true);
      } else {
        setModalMessage({
          title: "Chưa cho phép",
          desc: "Bạn cần chọn Cho phép khi trình duyệt hỏi quyền thông báo.",
        });
        setShowModal(true);
      }
    } catch (error) {
      console.error("Lỗi xin quyền thông báo:", error);
    }
  };

  // Hàm chuẩn hóa phân loại tab dựa vào kiểu thông báo trong DB
  const getCategory = (item: any) => {
    const type = (item.type || item.category || "").toLowerCase();
    if (type.includes("order") || type.includes("don_hang")) return "order";
    if (type.includes("cash") || type.includes("cong_tien") || type.includes("hoan_tien")) return "cash";
    if (type.includes("withdraw") || type.includes("rut_tien")) return "withdraw";
    return "news";
  };

  // Lọc thông báo theo tab
  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === "all") return true;
    return getCategory(item) === activeTab;
  });

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-gray-900">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto] items-center gap-4 px-4 sm:px-6 md:grid-cols-[1fr_auto_1fr] lg:px-8">
          <BrandLogo />
          <div className="hidden text-xs font-bold text-gray-600 md:block">
            Mua sắm hoàn tiền
          </div>
          <div className="flex justify-end">
            <HomeAuthNav />
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-50 shadow-2xs"
          >
            ← Trang chủ
          </Link>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 relative">
          <div className="flex items-center gap-3.5 border-b border-gray-100 pb-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-xl text-emerald-600 shadow-2xs">
              🔔
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">Thông báo</h1>
              <p className="text-xs text-gray-400">Cập nhật các tin tức và đơn hàng mới nhất của bạn</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 text-xs font-medium text-emerald-800">
            ℹ️ Thông báo cũ hơn 3 tháng sẽ được hệ thống tự động xóa.
          </div>

          {/* PUSH NOTIFICATION BANNER */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-emerald-200/70 bg-gradient-to-r from-emerald-50/60 to-teal-50/40 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
                🔔
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Bật thông báo tức thì</h3>
                <p className="mt-0.5 text-xs text-gray-600">
                  Nhận thông báo ngay cả khi đóng tab / trình duyệt (máy vẫn mở).
                </p>
                <span className="text-xs font-semibold text-emerald-600">
                  {notifPermission === "granted" ? "Đã bật trên máy này" : "Chưa bật trên máy này"}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleEnableNotifications}
              className="shrink-0 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600 shadow-sm"
            >
              {notifPermission === "granted" ? "Đã bật" : "Bật ngay"}
            </button>
          </div>

          {/* TABS FILTER */}
          <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-gray-100 pb-4">
            {[
              { id: "all", label: "Tất cả" },
              { id: "order", label: "Đơn hàng" },
              { id: "cash", label: "Cộng tiền" },
              { id: "withdraw", label: "Rút tiền" },
              { id: "news", label: "Tin tức" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                  activeTab === tab.id
                    ? "bg-emerald-500 text-white shadow-2xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* NOTIFICATION LIST */}
          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="py-12 text-center text-xs text-gray-400">Đang tải thông báo...</div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">
                Không có thông báo nào trong mục này.
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const cat = getCategory(item);
                const formattedDate = item.created_at
                  ? new Date(item.created_at).toLocaleString("vi-VN")
                  : "";

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-gray-200/70 bg-[#fafafa] p-4.5 transition hover:bg-white hover:shadow-xs"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                        {cat === "order" ? "📦" : cat === "cash" ? "💰" : cat === "withdraw" ? "💳" : "📢"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
                          <span className="shrink-0 text-[11px] font-medium text-gray-400">
                            {formattedDate}
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-gray-600">
                          {item.message || item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* MODAL */}
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
              <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-4">
                  <span className="text-3xl font-black">i</span>
                </div>
                <h3 className="text-xl font-black text-gray-900">{modalMessage.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-gray-600 px-4">
                  {modalMessage.desc}
                </p>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="mt-6 w-full rounded-xl bg-emerald-500 py-3 text-xs font-bold text-white shadow-md transition hover:bg-emerald-600"
                >
                  OK
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}