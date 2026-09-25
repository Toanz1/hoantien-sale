"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

const nav = [
  ["/dieu-khoan-su-dung","📖","Điều khoản sử dụng"],
  ["/chinh-sach-bao-mat","🛡","Chính sách bảo mật"],
  ["/bao-mat-tai-khoan","🔒","Bảo mật tài khoản"],
];

export default function PolicyPage() {
 const router=useRouter();
 return <main className="min-h-screen bg-[#fffdfb] text-[#201713]">
  <header className="border-b border-emerald-100 bg-white"><div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5">
   <Link href="/" className="flex items-center gap-3"><img src="/platforms/hoantiensale.png" alt="Hoàn Tiền Sale" className="h-12 w-12 rounded-full object-contain"/><b className="text-xl">Hoàn Tiền Sale</b></Link>
   <Link href="/" className="hidden font-bold md:block">Mua sắm hoàn tiền</Link><Link href="/profile" className="rounded-xl bg-emerald-50 px-4 py-2 font-bold text-emerald-700">Tài khoản</Link>
  </div></header>
  <div className="mx-auto max-w-7xl px-5 py-6">
   <div className="flex gap-3"><button onClick={()=>router.back()} className="rounded-full border border-emerald-200 px-4 py-2 text-sm font-bold text-emerald-700">← Quay lại</button><Link href="/" className="rounded-full border border-emerald-200 px-4 py-2 text-sm font-bold text-emerald-700">⌂ Trang chủ</Link></div>
   <section className="py-8 text-center"><div className="text-xs font-black uppercase tracking-widest text-emerald-500">Chính sách & điều khoản</div><h1 className="mt-2 text-3xl font-black">Bảo mật tài khoản, tránh web giả</h1><p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600">Không chia sẻ mật khẩu hoặc mã PIN rút tiền cho bất kỳ người nào.</p><div className="mt-2 text-xs text-gray-400">Cập nhật lần cuối: 25/09/2026</div></section>
   <div className="grid items-start gap-7 lg:grid-cols-[260px_minmax(0,1fr)]">
    <aside className="space-y-4 lg:sticky lg:top-5"><div className="rounded-3xl border bg-white p-4 shadow-sm"><div className="mb-3 px-3 text-xs font-black uppercase text-gray-500">Mục lục</div>
     {nav.map(([href,icon,label])=><Link key={href} href={href} className={"mb-1 block rounded-2xl px-4 py-3 text-sm font-bold "+(href==="/bao-mat-tai-khoan"?"bg-emerald-50 text-emerald-600":"text-gray-600 hover:bg-gray-50")}>{icon} {label}</Link>)}
    </div><div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5"><b className="text-sm">CẦN HỖ TRỢ THÊM?</b><p className="mt-2 text-sm leading-6 text-gray-600">Nếu có thắc mắc về tài khoản, hoàn tiền hoặc rút tiền, vui lòng liên hệ bộ phận hỗ trợ.</p><Link href="/" className="mt-4 block rounded-full bg-emerald-500 px-5 py-3 text-center text-sm font-black text-white">Liên hệ ngay</Link></div></aside>
    <article className="rounded-3xl border bg-white p-6 shadow-sm sm:p-8"><H n="1" t="Web chính thức"/><B>Chỉ đăng nhập và sử dụng Hoàn Tiền Sale trên tên miền chính thức của website.</B><B>Kiểm tra kỹ địa chỉ trên thanh trình duyệt trước khi nhập thông tin tài khoản.</B><H n="2" t="Mật khẩu và mã PIN"/><B>Không chia sẻ mật khẩu đăng nhập hoặc mã PIN rút tiền cho bất kỳ ai.</B><B>Hoàn Tiền Sale không yêu cầu bạn gửi mã PIN rút tiền qua tin nhắn để nhận hoàn tiền.</B><H n="3" t="Dấu hiệu lừa đảo"/><B>Cảnh giác với tên miền gần giống, tài khoản giả mạo hoặc yêu cầu chuyển tiền trước để nhận hoàn tiền.</B><B>Không mở liên kết đáng ngờ hoặc nhập thông tin đăng nhập trên website không xác định.</B><H n="4" t="Nếu đã nghi ngờ"/><B>Đổi mật khẩu và mã PIN rút tiền ngay khi nghi ngờ tài khoản bị truy cập trái phép.</B><B>Kiểm tra lịch sử rút tiền và liên hệ kênh hỗ trợ chính thức nếu phát hiện hoạt động bất thường.</B><div className="mt-7 rounded-2xl border bg-[#fffdfb] p-5 text-sm leading-6"><b>Thông tin liên hệ</b><p className="mt-2 text-gray-600">Nếu cần hỗ trợ về giao dịch, hoàn tiền, rút tiền hoặc bảo mật tài khoản, vui lòng sử dụng kênh hỗ trợ chính thức trên website Hoàn Tiền Sale.</p></div></article>
   </div>
  </div>
 </main>
}
function H({n,t}:{n:string;t:string}){return <h2 className="mb-3 mt-7 first:mt-0 text-lg font-black"><span className="mr-2 text-emerald-500">{n}.</span>{t}</h2>}
function B({children}:{children:React.ReactNode}){return <div className="mb-2.5 flex gap-3 text-sm leading-6 text-gray-700"><span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-gray-500"/><p>{children}</p></div>}
