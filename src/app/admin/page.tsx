'use client';
import AdminShell from '@/components/AdminShell';
import { get, fa, money } from '@/lib/client';
import { useEffect, useState } from 'react';

const MENU = [
  ['/admin', 'داشبورد'], ['/admin/standards', 'استانداردها'], ['/admin/bank', 'بانک سوالات'],
  ['/admin/reports', 'گزارش آزمون‌ها'], ['/admin/finance', 'مدیریت مالی'],
  ['/admin/users', 'کاربران'], ['/admin/settings', 'تنظیمات'],
];

export default function AdminHome() {
  const [d, setD] = useState<any>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  useEffect(() => { get('/admin/stats', true).then(setD); }, []);
  if (!d) return <AdminShell title="داشبورد"><p className="text-center py-10 text-slate-400">در حال بارگذاری...</p></AdminShell>;

  const s = d.summary;
  const maxUsers = Math.max(...d.monthlyUsers.map((m: any) => m.count), 1);
  const maxAttempts = Math.max(...d.monthlyAttempts.map((m: any) => m.count), 1);
  const maxRevenue = Math.max(...d.monthlyRevenue.map((m: any) => m.amount), 1);
  const maxGroupUsers = Math.max(...d.groupStats.map((g: any) => g.userCount), 1);

  // استانداردهای گروه انتخاب‌شده
  const groupStandards = selectedGroup
    ? d.standards.filter((std: any) => std.groupName === selectedGroup)
    : [];

  return (
    <AdminShell title="📊 داشبورد مدیریت">
      <div dir="rtl" className="space-y-6">

        {/* کارت‌های خلاصه */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="stat text-center"><b>{fa(s.totalUsers)}</b><span className="text-xs text-slate-400">کاربر</span></div>
          <div className="stat text-center"><b>{fa(s.totalAttempts)}</b><span className="text-xs text-slate-400">آزمون</span></div>
          <div className="stat text-center"><b className="text-emerald-600">{fa(s.passRate)}٪</b><span className="text-xs text-slate-400">قبولی</span></div>
          <div className="stat text-center"><b>{fa(s.avgScore)}</b><span className="text-xs text-slate-400">میانگین نمره</span></div>
          <div className="stat text-center"><b className="text-blue-600">{money(s.totalRevenue)}</b><span className="text-xs text-slate-400">درآمد (ت)</span></div>
          <div className="stat text-center"><b className="text-emerald-600">{fa(s.publishedQuestions)}</b><span className="text-xs text-slate-400">سوال منتشر</span></div>
          <div className="stat text-center"><b className="text-amber-500">{fa(s.pendingQuestions)}</b><span className="text-xs text-slate-400">در انتظار</span></div>
        </div>

        {/* نمودار ثبت‌نام کاربران + آزمون‌ها */}
        <div className="grid md:grid-cols-2 gap-4">
          <ChartCard title="📈 ثبت‌نام کاربران (۱۲ ماه اخیر)">
            <div className="flex items-end gap-1 h-40 mt-3">
              {d.monthlyUsers.map((m: any, i: number) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100">{fa(m.count)}</span>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-[#1D2E7A] to-[#2E4BD1] transition-all hover:opacity-80 cursor-pointer"
                    style={{ height: `${Math.max(4, (m.count / maxUsers) * 100)}%` }}
                    title={`${m.month}: ${fa(m.count)} کاربر`}
                  />
                  <span className="text-[9px] text-slate-400">{m.month}</span>
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard title="📝 آزمون‌های برگزارشده (۱۲ ماه اخیر)">
            <div className="flex items-end gap-1 h-40 mt-3">
              {d.monthlyAttempts.map((m: any, i: number) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100">{fa(m.count)}</span>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-[#0E9C9C] to-[#34d4d4] transition-all hover:opacity-80 cursor-pointer"
                    style={{ height: `${Math.max(4, (m.count / maxAttempts) * 100)}%` }}
                    title={`${m.month}: ${fa(m.count)} آزمون`}
                  />
                  <span className="text-[9px] text-slate-400">{m.month}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        {/* درآمد ماهانه */}
        <ChartCard title="💰 درآمد ماهانه (تومان)">
          <div className="flex items-end gap-1 h-32 mt-3">
            {d.monthlyRevenue.map((m: any, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 whitespace-nowrap">
                  {m.amount > 0 ? money(Math.round(m.amount / 1000)) + 'ه' : ''}
                </span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-[#F5A623] to-[#ffd580] transition-all hover:opacity-80"
                  style={{ height: `${Math.max(4, (m.amount / maxRevenue) * 100)}%` }}
                />
                <span className="text-[9px] text-slate-400">{m.month}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* کاربران به تفکیک گروه + دریل‌داون */}
        <ChartCard title="🎓 کاربران به تفکیک گروه برنامه‌ریزی درسی (کلیک کنید)">
          <div className="space-y-2 mt-3">
            {d.groupStats.map((g: any, i: number) => (
              <div key={i}>
                <div
                  className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${selectedGroup === g.groupName ? 'bg-[#E7ECFF] border-2 border-[#2E4BD1]' : 'hover:bg-slate-50 border-2 border-transparent'}`}
                  onClick={() => setSelectedGroup(selectedGroup === g.groupName ? null : g.groupName)}
                >
                  <span className="text-sm font-bold w-48 truncate">{g.groupName}</span>
                  <div className="flex-1 h-7 bg-slate-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg bg-gradient-to-r from-[#1D2E7A] to-[#2E4BD1] flex items-center justify-end px-2 transition-all"
                      style={{ width: `${Math.max(8, (g.userCount / maxGroupUsers) * 100)}%` }}
                    >
                      <span className="text-white text-xs font-bold">{fa(g.userCount)}</span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap">{fa(g.standardCount)} استاندارد</span>
                  <span className="text-slate-400">{selectedGroup === g.groupName ? '▲' : '▼'}</span>
                </div>

                {/* دریل‌داون: استانداردهای این گروه */}
                {selectedGroup === g.groupName && (
                  <div className="mr-12 mt-2 space-y-1 border-r-2 border-[#E7ECFF] pr-3">
                    {groupStandards.map((std: any) => {
                      const stdAttempts = Math.floor(Math.random() * 50); // نمونه
                      return (
                        <div key={std.code} className="flex items-center gap-2 text-xs p-2 rounded-lg hover:bg-slate-50">
                          <span className={`w-2 h-2 rounded-full ${std.published ? 'bg-emerald-500' : 'bg-rose-400'}`} />
                          <span className="font-bold flex-1 truncate">{std.title}</span>
                          <code className="text-slate-400">{std.code}</code>
                        </div>
                      );
                    })}
                    {groupStandards.length === 0 && <p className="text-xs text-slate-400 p-2">استانداردی در این گروه نیست</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ChartCard>

      </div>
    </AdminShell>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h3 className="font-bold text-sm">{title}</h3>
      {children}
    </div>
  );
}
