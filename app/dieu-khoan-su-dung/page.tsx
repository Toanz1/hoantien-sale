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
   <section className="py-8 text-center"><div className="text-xs font-black uppercase tracking-widest text-emerald-500">Chính sách & điều khoản</div><h1 className="mt-2 text-3xl font-black">Điều khoản sử dụng</h1><p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600">Các quy định khi sử dụng Hoàn Tiền Sale và chương trình hoàn tiền.</p><div className="mt-2 text-xs text-gray-400">Cập nhật lần cuối: 25/09/2026</div></section>
   <div className="grid items-start gap-7 lg:grid-cols-[260px_minmax(0,1fr)]">
    <aside className="space-y-4 lg:sticky lg:top-5"><div className="rounded-3xl border bg-white p-4 shadow-sm"><div className="mb-3 px-3 text-xs font-black uppercase text-gray-500">Mục lục</div>
     {nav.map(([href,icon,label])=><Link key={href} href={href} className={"mb-1 block rounded-2xl px-4 py-3 text-sm font-bold "+(href==="/dieu-khoan-su-dung"?"bg-emerald-50 text-emerald-600":"text-gray-600 hover:bg-gray-50")}>{icon} {label}</Link>)}
    </div><div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5"><b className="text-sm">CẦN HỖ TRỢ THÊM?</b><p className="mt-2 text-sm leading-6 text-gray-600">Nếu có thắc mắc về tài khoản, hoàn tiền hoặc rút tiền, vui lòng liên hệ bộ phận hỗ trợ.</p><Link href="/" className="mt-4 block rounded-full bg-emerald-500 px-5 py-3 text-center text-sm font-black text-white">Liên hệ ngay</Link></div></aside>
    <article className="rounded-3xl border bg-white p-6 shadow-sm sm:p-8"><H n="1" t="Hoàn tiền"/><B>Hoàn Tiền Sale là website hỗ trợ hoàn tiền, không trực tiếp bán hàng và không phải là sàn thương mại điện tử.</B><B>Khoản hoàn tiền chỉ được ghi nhận khi giao dịch được hệ thống hoặc đối tác xác nhận đủ điều kiện.</B><H n="2" t="Tài khoản"/><B>Người dùng chịu trách nhiệm cung cấp thông tin chính xác và bảo vệ thông tin đăng nhập.</B><H n="3" t="Cách nhận hoàn tiền"/><B>Người dùng cần bắt đầu mua sắm từ liên kết do Hoàn Tiền Sale cung cấp.</B><B>Đơn hàng bị hủy, hoàn trả hoặc không đủ điều kiện có thể không được hưởng hoàn tiền.</B><H n="4" t="Khi nào được trả tiền"/><B>Tiền hoàn được cộng vào số dư khả dụng sau khi giao dịch được xác nhận qua đối soát.</B><H n="5" t="Ví & rút tiền"/><B>Để rút tiền, người dùng phải cung cấp chính xác thông tin ngân hàng và xác nhận bằng mã PIN rút tiền.</B><B>Yêu cầu có thể ở trạng thái Chờ xử lý, Đang xử lý, Đã thanh toán hoặc Từ chối.</B><H n="6" t="Hành vi không được phép"/><B>Không tạo giao dịch giả, lợi dụng chương trình hoặc can thiệp hệ thống để nhận tiền hoàn trái điều kiện.</B><H n="7" t="Cập nhật điều khoản"/><B>Hoàn Tiền Sale có thể cập nhật điều khoản để phù hợp với hoạt động hệ thống và chính sách đối tác.</B><div className="mt-7 rounded-2xl border bg-[#fffdfb] p-5 text-sm leading-6"><b>Thông tin liên hệ</b><p className="mt-2 text-gray-600">Nếu cần hỗ trợ về giao dịch, hoàn tiền, rút tiền hoặc bảo mật tài khoản, vui lòng sử dụng kênh hỗ trợ chính thức trên website Hoàn Tiền Sale.</p></div></article>
   </div>
  </div>
 </main>
}
function H({n,t}:{n:string;t:string}){return <h2 className="mb-3 mt-7 first:mt-0 text-lg font-black"><span className="mr-2 text-emerald-500">{n}.</span>{t}</h2>}
function B({children}:{children:React.ReactNode}){return <div className="mb-2.5 flex gap-3 text-sm leading-6 text-gray-700"><span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-gray-500"/><p>{children}</p></div>}
