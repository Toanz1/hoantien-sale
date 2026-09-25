"use client";
import { FormEvent,useCallback,useEffect,useMemo,useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Platform="shopee"|"lazada"|"tiktok";
type Coupon={id:string;platform:Platform;code:string;title:string;description:string|null;min_order_value:number;starts_at:string;expires_at:string;destination_url:string|null;is_active:boolean};
type Form={platform:Platform;code:string;title:string;description:string;min_order_value:string;starts_at:string;expires_at:string;destination_url:string;is_active:boolean};
const empty:Form={platform:"shopee",code:"",title:"",description:"",min_order_value:"0",starts_at:"",expires_at:"",destination_url:"",is_active:true};

const name=(p:Platform)=>p==="shopee"?"Shopee":p==="lazada"?"Lazada":"TikTok Shop";
const logo=(p:Platform)=>p==="shopee"?"/platforms/shopee.png":p==="lazada"?"/platforms/lazada.png":"/platforms/tiktok-shop.png";
const toLocal=(v:string)=>{const d=new Date(v);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16)};
function status(c:Coupon){const n=Date.now();if(!c.is_active)return["Đã tắt","bg-gray-100 text-gray-600"];if(new Date(c.starts_at).getTime()>n)return["Chờ đến giờ","bg-blue-100 text-blue-700"];if(new Date(c.expires_at).getTime()<=n)return["Hết hạn","bg-red-100 text-red-700"];return["Đang chạy","bg-emerald-100 text-emerald-700"]}

export default function AdminCouponsPage(){
 const supabase=useMemo(()=>createClient(),[]);
 const [items,setItems]=useState<Coupon[]>([]),[form,setForm]=useState<Form>(empty);
 const [editing,setEditing]=useState<string|null>(null),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState("");
 const load=useCallback(async()=>{setLoading(true);const r=await supabase.from("coupons").select("*").order("starts_at",{ascending:false});if(r.error)setError(r.error.message);else setItems((r.data||[]) as Coupon[]);setLoading(false)},[supabase]);
 useEffect(()=>{void load()},[load]);
 const change=<K extends keyof Form>(k:K,v:Form[K])=>setForm(x=>({...x,[k]:v}));
 async function submit(e:FormEvent){e.preventDefault();setError("");if(!form.code.trim()||!form.title.trim()||!form.starts_at||!form.expires_at)return setError("Nhập đủ mã, tiêu đề, giờ bắt đầu và hết hạn.");if(new Date(form.expires_at)<=new Date(form.starts_at))return setError("Giờ hết hạn phải sau giờ bắt đầu.");setSaving(true);const payload={platform:form.platform,code:form.code.trim(),title:form.title.trim(),description:form.description.trim()||null,min_order_value:Number(form.min_order_value||0),starts_at:new Date(form.starts_at).toISOString(),expires_at:new Date(form.expires_at).toISOString(),destination_url:form.destination_url.trim()||null,is_active:form.is_active,updated_at:new Date().toISOString()};const r=editing?await supabase.from("coupons").update(payload).eq("id",editing):await supabase.from("coupons").insert(payload);setSaving(false);if(r.error)return setError(r.error.message);setForm(empty);setEditing(null);await load()}
 function edit(c:Coupon){setEditing(c.id);setForm({platform:c.platform,code:c.code,title:c.title,description:c.description||"",min_order_value:String(c.min_order_value||0),starts_at:toLocal(c.starts_at),expires_at:toLocal(c.expires_at),destination_url:c.destination_url||"",is_active:c.is_active});window.scrollTo({top:0,behavior:"smooth"})}
 async function toggle(c:Coupon){const r=await supabase.from("coupons").update({is_active:!c.is_active,updated_at:new Date().toISOString()}).eq("id",c.id);if(r.error)setError(r.error.message);else await load()}
 async function remove(c:Coupon){if(!window.confirm(`Xóa voucher ${c.code}?`))return;const r=await supabase.from("coupons").delete().eq("id",c.id);if(r.error)setError(r.error.message);else await load()}
 return <main className="min-h-screen bg-[#f7f8fa]"><div className="mx-auto max-w-7xl px-5 py-8">
  <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><Link href="/admin" className="text-sm font-bold text-emerald-600">← Admin Dashboard</Link><h1 className="mt-2 text-3xl font-black">Quản lý Voucher</h1><p className="mt-1 text-sm text-gray-500">Đến giờ tự hiện, hết hạn tự ẩn.</p></div><Link href="/coupons" className="rounded-xl border bg-white px-4 py-2 text-sm font-bold">Xem trang voucher →</Link></header>
  <form onSubmit={submit} className="mt-7 rounded-3xl border bg-white p-6 shadow-sm"><h2 className="mb-5 text-xl font-black">{editing?"Sửa voucher":"Thêm voucher"}</h2>{error&&<div className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}
   <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    <Field label="Sàn"><select value={form.platform} onChange={e=>change("platform",e.target.value as Platform)} className="input"><option value="shopee">Shopee</option><option value="lazada">Lazada</option><option value="tiktok">TikTok Shop</option></select></Field>
    <Field label="Mã voucher"><input className="input" value={form.code} onChange={e=>change("code",e.target.value)} placeholder="SALE100"/></Field>
    <Field label="Tiêu đề"><input className="input" value={form.title} onChange={e=>change("title",e.target.value)} placeholder="Giảm 100K"/></Field>
    <Field label="Đơn tối thiểu"><input className="input" type="number" min="0" value={form.min_order_value} onChange={e=>change("min_order_value",e.target.value)}/></Field>
    <Field label="Bắt đầu"><input className="input" type="datetime-local" value={form.starts_at} onChange={e=>change("starts_at",e.target.value)}/></Field>
    <Field label="Hết hạn"><input className="input" type="datetime-local" value={form.expires_at} onChange={e=>change("expires_at",e.target.value)}/></Field>
    <Field label="Link Dùng ngay"><input className="input" value={form.destination_url} onChange={e=>change("destination_url",e.target.value)} placeholder="https://..."/></Field>
    <div className="md:col-span-2"><Field label="Mô tả / điều kiện"><input className="input" value={form.description} onChange={e=>change("description",e.target.value)} placeholder="Áp dụng toàn sàn..."/></Field></div>
   </div>
   <label className="mt-4 flex gap-2 text-sm font-bold"><input type="checkbox" checked={form.is_active} onChange={e=>change("is_active",e.target.checked)}/> Cho phép hoạt động theo lịch</label>
   <div className="mt-5 flex gap-2"><button disabled={saving} className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-white">{saving?"Đang lưu...":editing?"Cập nhật":"+ Thêm voucher"}</button>{editing&&<button type="button" onClick={()=>{setEditing(null);setForm(empty)}} className="rounded-xl border px-5 py-3 text-sm font-black">Hủy</button>}</div>
  </form>
  <section className="mt-7 overflow-hidden rounded-3xl border bg-white shadow-sm"><div className="border-b p-6"><h2 className="text-xl font-black">Danh sách voucher</h2></div>{loading?<div className="p-10 text-center">Đang tải...</div>:!items.length?<div className="p-10 text-center text-gray-400">Chưa có voucher.</div>:<div className="divide-y">{items.map(c=>{const s=status(c);return <div key={c.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"><div className="flex h-16 w-16 items-center justify-center rounded-2xl border p-2"><img src={logo(c.platform)} alt={name(c.platform)} className="h-full w-full object-contain"/></div><div className="min-w-0 flex-1"><div className="flex gap-2"><b className="text-xs text-emerald-600">{name(c.platform)}</b><span className={`rounded-full px-2 py-1 text-[10px] font-black ${s[1]}`}>{s[0]}</span></div><div className="mt-1 font-black">{c.title} · {c.code}</div><div className="mt-1 text-xs text-gray-500">{new Date(c.starts_at).toLocaleString("vi-VN")} → {new Date(c.expires_at).toLocaleString("vi-VN")}</div></div><div className="flex gap-2"><button onClick={()=>edit(c)} className="rounded-xl border px-4 py-2 text-xs font-black">Sửa</button><button onClick={()=>void toggle(c)} className="rounded-xl border px-4 py-2 text-xs font-black">{c.is_active?"Tắt":"Bật"}</button><button onClick={()=>void remove(c)} className="rounded-xl border border-red-200 px-4 py-2 text-xs font-black text-red-600">Xóa</button></div></div>})}</div>}</section>
 </div><style jsx>{`.input{width:100%;height:44px;border:1px solid #e5e7eb;border-radius:12px;padding:0 12px;outline:none}.input:focus{border-color:#10b981}`}</style></main>
}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="block"><span className="mb-1.5 block text-xs font-black text-gray-600">{label}</span>{children}</label>}
