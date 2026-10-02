'use client';
import { get, fa, money } from '@/lib/client';
import { useEffect, useState } from 'react';

const MENU = [['/admin','داشبورد'],['/admin/standards','استانداردها'],['/admin/bank','بانک سوالات'],['/admin/reports','گزارش آزمون‌ها'],['/admin/finance','مدیریت مالی'],['/admin/users','کاربران'],['/admin/settings','تنظیمات']];

export default function AdminHome() {
  const [d, setD] = useState<any>(null);
  useEffect(() => { get('/admin/stats', true).then(setD); }, []);
  return (
    <div className="grid md:grid-cols-[225px_1fr] gap-0 min-h-[70vh] mt-6" dir="rtl">
      <aside className="bg-[#141E4D] text-white p-4 flex md:flex-col gap-1 overflow-x-auto">
        {MENU.map(([href, label]) => <a key={href} href={href} className="block px-4 py-2.5 rounded-lg text-sm text-[#C9D2F2] hover:bg-white/10">{label}</a>)}
        <a href="/" className="mt-2 block px-4 py-2.5 rounded-lg text-sm text-[#C9D2F2] hover:bg-white/10">↩ سایت</a>
      </aside>
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">داشبورد مدیریت</h2>
        {!d ? <p>…</p> : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="stat"><b>{money(d.todayRevenue)}</b><span className="text-xs text-slate-400">درآمد امروز</span></div>
            <div className="stat"><b>{money(d.totalRevenue)}</b><span className="text-xs text-slate-400">درآمد کل</span></div>
            <div className="stat"><b>{fa(d.attemptCount)}</b><span className="text-xs text-slate-400">آزمون‌ها</span></div>
            <div className="stat"><b>{fa(d.userCount)}</b><span className="text-xs text-slate-400">کاربران</span></div>
          </div>
        )}
      </div>
    </div>
  );
}
