'use client';
import AdminShell from '@/components/AdminShell';
import { get, post } from '@/lib/client';
import { useEffect, useState } from 'react';
import SmartTable from '@/components/SmartTable';
export default function P(){
  const doBackup=async()=>{await post('/admin/backup/create',{},true);window.open('/api/admin/backup/download','_blank')};
  return(<AdminShell title="💾 نسخه پشتیبان دیتابیس"><div dir="rtl">
    <div className="grid md:grid-cols-2 gap-4 items-start">
      <div className="card"><h3>تهیه نسخه پشتیبان دستی</h3><p className="text-sm text-slate-400">هر زمان خواستید، یک نسخه کامل تهیه کنید.</p>
      <button className="btn-p w-full mt-3 !py-3" onClick={doBackup}>💾 تهیه و دانلود نسخه پشتیبان</button>
      <div className="mt-3 bg-amber-50 text-amber-700 rounded-lg p-3 text-xs">⚙️ در لیارا: اسنپ‌شات روزانه خودکار + pg_dump هفتگی به Object Storage.</div></div>
      <div className="card"><h3>🔄 بازیابی</h3><p className="text-sm text-slate-400">بازیابی داده‌های فعلی را بازنویسی می‌کند؛ نیازمند تأیید دومرحله‌ای است.</p>
      <div className="upbox mt-3">📂 انتخاب فایل پشتیبان (در نسخه اصلی فعال است)</div></div>
    </div>
    <h3 className="mt-4">تاریخچه پشتیبان‌گیری</h3>
    <SmartTable endpoint="/admin/backup/list" searchPh="🔍 تاریخچه…"
      cols={[{h:'تاریخ',c:(r:any)=>new Intl.DateTimeFormat('fa-IR').format(new Date(r.createdAt))},
        {h:'نوع',c:(r:any)=><span className="b-info">{r.type}</span>},
        {h:'تهیه‌کننده',c:(r:any)=>r.adminEmail}]} />
  </div></AdminShell>)}
