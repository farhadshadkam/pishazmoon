'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { get, fa } from '@/lib/client';
export default function Dash() {
  const [data, setData] = useState<{ codes: any[]; attempts: any[]; user: any } | null>(null);
  useEffect(() => { get('/me/overview').then(setData); }, []);
  if (!data) return <p className="p-10 text-center">در حال بارگذاری…</p>;
  return (<div dir="rtl" className="mt-6">
    <h1 className="text-2xl font-bold">داشبورد من</h1>
    <div className="grid md:grid-cols-2 gap-6 items-start mt-4">
      <div>
        <h3>کدهای آزمون من</h3>
        {data.codes.map((c) => (
          <div key={c.id} className="card p-4 mb-2 flex justify-between items-center flex-wrap gap-2">
            <div><b>{c.standard.title}</b><div className="text-xs text-slate-400">خرید: {new Intl.DateTimeFormat('fa-IR').format(new Date(c.purchasedAt))}</div></div>
            <div className="text-left">
              <span className={c.status === 'ACTIVE' ? 'b-ok' : c.status === 'USED' ? 'b-gray' : 'b-bad'}>{c.status === 'ACTIVE' ? 'فعال' : c.status === 'USED' ? 'مصرف‌شده' : 'منقضی'}</span>
              <div className="text-xs font-mono" dir="ltr">{c.code}</div>
              {c.status === 'ACTIVE' && <Link href="/exam-entry" className="btn-p btn-sm mt-1 block text-center">ورود به آزمون</Link>}
            </div>
          </div>))}
        <h3 className="mt-5">کارنامه‌های من</h3>
        {data.attempts.map((a) => (
          <div key={a.id} className="card p-3 mb-2 flex justify-between items-center">
            <div><b className="text-sm">{a.standard.title}</b><div className="text-xs text-slate-400">{new Intl.DateTimeFormat('fa-IR').format(new Date(a.startedAt))}</div></div>
            <div className="flex gap-2 items-center">
              <b className={a.passed ? 'text-emerald-600' : 'text-rose-600'}>{fa(a.score)}</b>
              <span className={a.passed ? 'b-ok' : 'b-bad'}>{a.passed ? 'قبول' : 'مردود'}</span>
              <Link href={`/report/${a.id}`} className="btn-g btn-sm">مشاهده</Link>
            </div>
          </div>))}
      </div>
      <div className="card"><h3>👤 پروفایل</h3>
        {[['نام', `${data.user.firstName} ${data.user.lastName}`],['کد ملی', fa(data.user.nationalId)],['موبایل', fa(data.user.mobile)]].map(([k, v]) => (
          <div key={k} className="flex justify-between py-2 border-b border-dashed text-sm"><span className="text-slate-400">{k}</span><b>{v}</b></div>))}
      </div>
    </div>
  </div>);
}
