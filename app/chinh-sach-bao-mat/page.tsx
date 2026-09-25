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
   <section className="py-8 text-center"><div className="text-xs font-black uppercase tracking-widest text-emerald-500">Chính sách & điều khoản</div><h1 className="mt-2 text-3xl font-black">Chính sách bảo mật</h1><p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600">Cách Hoàn Tiền Sale sử dụng và bảo vệ thông tin cần thiết cho hoạt động tài khoản.</p><div className="mt-2 text-xs text-gray-400">Cập nhật lần cuối: 25/09/2026</div></section>
   <div className="grid items-start gap-7 lg:grid-cols-[260px_minmax(0,1fr)]">
    <aside className="space-y-4 lg:sticky lg:top-5"><div className="rounded-3xl border bg-white p-4 shadow-sm"><div className="mb-3 px-3 text-xs font-black uppercase text-gray-500">Mục lục</div>
     {nav.map(([href,icon,label])=><Link key={href} href={href} className={"mb-1 block rounded-2xl px-4 py-3 text-sm font-bold "+(href==="/chinh-sach-bao-mat"?"bg-emerald-50 text-emerald-600":"text-gray-600 hover:bg-gray-50")}>{icon} {label}</Link>)}
    </div><div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5"><b className="text-sm">CẦN HỖ TRỢ THÊM?</b><p className="mt-2 text-sm leading-6 text-gray-600">Nếu có thắc mắc về tài khoản, hoàn tiền hoặc rút tiền, vui lòng liên hệ bộ phận hỗ trợ.</p><Link href="/" className="mt-4 block rounded-full bg-emerald-500 px-5 py-3 text-center text-sm font-black text-white">Liên hệ ngay</Link></div></aside>
    <article className="rounded-3xl border bg-white p-6 shadow-sm sm:p-8"><H n="1" t="Dữ liệu chúng tôi sử dụng"/><B>Thông tin cần thiết được sử dụng để vận hành tài khoản, ghi nhận hoàn tiền, rút tiền và hỗ trợ người dùng.</B><B>Thông tin ngân hàng được sử dụng để xử lý yêu cầu rút tiền và đối soát.</B><H n="2" t="Thông tin không thu thập"/><B>Hoàn Tiền Sale không yêu cầu mật khẩu tài khoản ngân hàng hoặc mã PIN ngân hàng để thực hiện hoàn tiền.</B><H n="3" t="Dùng dữ liệu để làm gì"/><B>Dữ liệu phục vụ đăng nhập, vận hành tài khoản, ghi nhận giao dịch, hoàn tiền, rút tiền và bảo vệ hệ thống.</B><H n="4" t="Chia sẻ dữ liệu"/><B>Không công khai thông tin ngân hàng của người dùng trên website.</B><H n="5" t="Cookie và phiên đăng nhập"/><B>Website có thể sử dụng cookie hoặc dữ liệu phiên để duy trì đăng nhập và bảo vệ tài khoản.</B><H n="6" t="Thời gian lưu"/><B>Thông tin được lưu trong thời gian cần thiết cho vận hành, đối soát và hỗ trợ.</B><H n="7" t="Bạn kiểm soát gì"/><B>Người dùng có thể cập nhật các thông tin được website cho phép chỉnh sửa trong khu vực Hồ sơ.</B><div className="mt-7 rounded-2xl border bg-[#fffdfb] p-5 text-sm leading-6"><b>Thông tin liên hệ</b><p className="mt-2 text-gray-600">Nếu cần hỗ trợ về giao dịch, hoàn tiền, rút tiền hoặc bảo mật tài khoản, vui lòng sử dụng kênh hỗ trợ chính thức trên website Hoàn Tiền Sale.</p></div></article>
   </div>
  </div>
 </main>
}
function H({n,t}:{n:string;t:string}){return <h2 className="mb-3 mt-7 first:mt-0 text-lg font-black"><span className="mr-2 text-emerald-500">{n}.</span>{t}</h2>}
function B({children}:{children:React.ReactNode}){return <div className="mb-2.5 flex gap-3 text-sm leading-6 text-gray-700"><span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-gray-500"/><p>{children}</p></div>}
