'use client';
import AdminShell from '@/components/AdminShell';
import { get, post } from '@/lib/client';
import { useEffect, useState } from 'react';
export default function P(){const [links,setLinks]=useState<any[]>([]);const [nt,setNt]=useState('');const [nu,setNu]=useState('');
  const load=async()=>setLinks(await get('/admin/links',true));useEffect(()=>{load()},[]);
  const add=async()=>{if(!nt||!nu)return;await post('/admin/links',{title:nt,url:nu},true);setNt('');setNu('');load()};
  const del=async(id:string)=>{await post(`/admin/links/${id}/delete`,{},true);load()};
  const tog=async(l:any)=>{await post(`/admin/links/${l.id}`, {active:!l.active}, true);load()};
  return(<AdminShell title="محتوا و لینک‌ها"><div dir="rtl">
    <div className="card"><div className="flex justify-between items-center"><h3>لینک‌های مرتبط</h3></div>
    {links.map((l)=>(<div key={l.id} className="flex justify-between items-center gap-2 py-2 border-b border-dashed">
      <div><b className="text-sm">{l.title}</b><div className="text-xs text-slate-400" dir="ltr">{l.url}</div></div>
      <div className="flex gap-1"><span className={l.active?'b-ok':'b-gray'}>{l.active?'نمایش':'مخفی'}</span>
      <button className="btn-g btn-sm" onClick={()=>tog(l)}>تغییر</button>
      <button className="btn-d btn-sm" onClick={()=>del(l.id)}>✖</button></div></div>))}
    <div className="flex gap-2 mt-4"><input className="inp" placeholder="عنوان" value={nt} onChange={e=>setNt(e.target.value)} />
    <input className="inp" placeholder="https://…" dir="ltr" value={nu} onChange={e=>setNu(e.target.value)} />
    <button className="btn-p" onClick={add}>➕ افزودن</button></div></div>
  </div></AdminShell>)}
