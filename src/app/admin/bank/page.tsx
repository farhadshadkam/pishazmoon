'use client';
import AdminShell from '@/components/AdminShell';
import { get, post, fa } from '@/lib/client';
import { useEffect, useState, useCallback } from 'react';

type Tab = 'stats' | 'pending' | 'published';

export default function AdminBank() {
  const [tab, setTab] = useState<Tab>('stats');

  return (
    <AdminShell title="🏦 بانک سوالات">
      <div dir="rtl">
        {/* تب‌ها */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <button className={`btn ${tab === 'stats' ? 'btn-p' : 'btn-g'} btn-sm`} onClick={() => setTab('stats')}>📊 آمار بانک</button>
          <button className={`btn ${tab === 'pending' ? 'btn-p' : 'btn-g'} btn-sm`} onClick={() => setTab('pending')}>⏳ صف بازبینی</button>
          <button className={`btn ${tab === 'published' ? 'btn-p' : 'btn-g'} btn-sm`} onClick={() => setTab('published')}>✅ انتشار‌یافته</button>
          <a href="/admin/gen" className="btn-t btn-sm mr-auto">📥 ایمپورت سوالات جدید</a>
        </div>

        {tab === 'stats' && <StatsTab />}
        {tab === 'pending' && <QuestionsTab status="PENDING" />}
        {tab === 'published' && <QuestionsTab status="PUBLISHED" />}
      </div>
    </AdminShell>
  );
}

/* ═══════════ تب آمار ═══════════ */
function StatsTab() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { get('/admin/bank/stats', true).then(setData); }, []);
  if (!data) return <p className="text-center py-10 text-slate-400">در حال بارگذاری...</p>;

  const { standards, summary } = data;

  return (
    <div>
      {/* کارت‌های خلاصه */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="stat text-center"><b>{fa(summary.totalStandards)}</b><span className="text-xs text-slate-400">استاندارد</span></div>
        <div className="stat text-center"><b className="text-emerald-600">{fa(summary.totalPublished)}</b><span className="text-xs text-slate-400">انتشار‌یافته</span></div>
        <div className="stat text-center"><b className="text-amber-500">{fa(summary.totalPending)}</b><span className="text-xs text-slate-400">در انتظار</span></div>
        <div className="stat text-center"><b className="text-rose-600">{fa(summary.totalRejected)}</b><span className="text-xs text-slate-400">ردشده</span></div>
        <div className="stat text-center"><b className="text-blue-600">{fa(summary.totalRequired)}</b><span className="text-xs text-slate-400">نیاز کل بانک</span></div>
      </div>

      {/* کارت هر استاندارد */}
      {standards.length === 0 ? (
        <div className="card text-center border-dashed py-12"><div className="text-4xl">📭</div><b>هنوز استانداردی ثبت نشده</b></div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {standards.map((std: any) => {
            const ready = std.totalPublished >= 400;
            const pct = Math.min(100, Math.round((std.totalPublished / Math.max(1, std.totalRequired)) * 100));
            return (
              <div key={std.id} className="card">
                <div className="flex justify-between items-start gap-2 flex-wrap">
                  <div>
                    <b className="text-sm">{std.title}</b>
                    <p className="text-xs text-slate-400">{std.groupName} › {std.profession} › {std.job}</p>
                    <code className="text-xs bg-slate-100 px-1.5 rounded mt-1 inline-block">کد {std.code}</code>
                  </div>
                  <span className={ready ? 'b-ok' : 'b-warn'}>{ready ? 'آزمون فعال' : 'در حال تکمیل'}</span>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">آمادگی بانک</span>
                    <b>{fa(std.totalPublished)} / {fa(std.totalRequired)}</b>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: ready ? '#16A34A' : pct >= 50 ? '#F5A623' : '#E11D48' }} />
                  </div>
                </div>
                {/* فصل‌ها */}
                <div className="mt-3 space-y-1">
                  {std.chapters.map((ch: any, i: number) => {
                    const chPct = Math.min(100, Math.round((ch.published / Math.max(1, ch.required)) * 100));
                    return (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="w-6 text-slate-400">{fa(i + 1)}.</span>
                        <span className="flex-1 truncate" title={ch.title}>{ch.title}</span>
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${chPct}%`, background: chPct >= 100 ? '#16A34A' : '#F5A623' }} />
                        </div>
                        <span className="w-16 text-left text-slate-400">{fa(ch.published)}/{fa(ch.required)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════ تب سوالات (بازبینی / انتشار‌یافته) ═══════════ */
function QuestionsTab({ status }: { status: 'PENDING' | 'PUBLISHED' }) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [ps] = useState(20);
  const [q, setQ] = useState('');
  const [h, setH] = useState({ g: '', p: '', j: '', s: '' });
  const [opts, setOpts] = useState<any>({ gs: [], ps: [], js: [] });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const sp = new URLSearchParams({ status, page: String(page), ps: String(ps), ...(q && { q }), ...h });
    const d = await get(`/admin/questions/list?${sp}`, true);
    setQuestions(d.items || []);
    setTotal(d.total || 0);
    if (d.hierOpts) setOpts(d.hierOpts);
    setLoading(false);
  }, [status, page, ps, q, h]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [q, h]);

  const approve = async (id: string) => {
    await post(`/admin/questions/${id}/status`, { status: 'PUBLISHED' }, true); load();
  };
  const reject = async (id: string) => {
    await post(`/admin/questions/${id}/status`, { status: 'REJECTED' }, true); load();
  };
  const approveAll = async () => {
    if (!confirm(`تأیید همه ${fa(questions.length)} سوال این صفحه؟`)) return;
    for (const item of questions) await post(`/admin/questions/${item.id}/status`, { status: 'PUBLISHED' }, true);
    load();
  };

  const pages = Math.max(1, Math.ceil(total / ps));
  const setHier = (k: string, v: string) => {
    if (k === 'g') setH({ g: v, p: '', j: '', s: '' });
    else if (k === 'p') setH({ ...h, p: v, j: '', s: '' });
    else if (k === 'j') setH({ ...h, j: v, s: '' });
  };

  return (
    <div>
      {/* نوار فیلتر */}
      <div className="flex flex-wrap gap-2 items-center my-3">
        <input className="inp max-w-[250px]" placeholder="🔍 جستجو در متن سوال..." value={q}
          onChange={(e) => setQ(e.target.value)} />
        <select className="inp max-w-[160px]" value={h.g} onChange={(e) => setHier('g', e.target.value)}>
          <option value="">همه گروه‌ها</option>
          {opts.gs?.map((x: string) => <option key={x}>{x}</option>)}
        </select>
        <select className="inp max-w-[160px]" value={h.p} onChange={(e) => setHier('p', e.target.value)} disabled={!h.g}>
          <option value="">همه حرفه‌ها</option>
          {opts.ps?.map((x: string) => <option key={x}>{x}</option>)}
        </select>
        <select className="inp max-w-[160px]" value={h.j} onChange={(e) => setHier('j', e.target.value)} disabled={!h.g || !h.p}>
          <option value="">همه مشاغل</option>
          {opts.js?.map((x: string) => <option key={x}>{x}</option>)}
        </select>
        <button className="btn-g btn-sm" onClick={() => { setQ(''); setH({ g: '', p: '', j: '', s: '' }); }}>🔁</button>
        {status === 'PENDING' && questions.length > 0 && (
          <button className="btn-t btn-sm" onClick={approveAll}>⚡ تأیید همه این صفحه</button>
        )}
      </div>

      {/* تعداد */}
      <p className="text-sm text-slate-400 mb-3">{fa(total)} سوال {status === 'PENDING' ? 'در انتظار بازبینی' : 'انتشار‌یافته'}</p>

      {loading ? (
        <p className="text-center py-10 text-slate-400">در حال بارگذاری...</p>
      ) : questions.length === 0 ? (
        <div className="card text-center border-dashed py-12">
          <div className="text-4xl">{status === 'PENDING' ? '✅' : '📭'}</div>
          <b>{status === 'PENDING' ? 'صف بازبینی خالی است' : 'سوال انتشار‌یافته‌ای یافت نشد'}</b>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {questions.map((item, idx) => (
              <div key={item.id} className="card p-4">
                <div className="flex justify-between items-start gap-3 flex-wrap">
                  <div className="flex-1 min-w-[250px]">
                    <div className="flex gap-2 mb-2 flex-wrap">
                      <span className="b-gray">#{fa((page - 1) * ps + idx + 1)}</span>
                      <span className="b-info">{item.chapter?.standard?.title}</span>
                      <span className="b-warn">{item.chapter?.title}</span>
                      <span className="b-gray">{item.cognitive}</span>
                      <span className="b-gray">{item.difficulty}</span>
                    </div>
                    <p className="text-sm font-bold leading-7">{item.text}</p>
                    <div className="mt-2 space-y-1">
                      {item.opt.map((o: string, i: number) => (
                        <div key={i} className={`text-sm flex items-start gap-2 rounded-lg px-3 py-1.5 ${
                          i === item.correct ? 'bg-emerald-50 text-emerald-700 font-bold' : 'bg-slate-50'
                        }`}>
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs font-bold ${
                            i === item.correct ? 'bg-emerald-200' : 'bg-slate-200'
                          }`}>{i === item.correct ? '✓' : ['الف','ب','ج','د'][i]}</span>
                          <span>{o}</span>
                        </div>
                      ))}
                    </div>
                    {item.source && <p className="text-xs text-slate-400 mt-2">📍 {item.source}</p>}
                  </div>
                  <div className="flex flex-col gap-2">
                    {status === 'PENDING' ? (
                      <>
                        <button className="btn-t btn-sm" onClick={() => approve(item.id)}>✔ تأیید</button>
                        <button className="btn-d btn-sm" onClick={() => reject(item.id)}>✖ رد</button>
                      </>
                    ) : (
                      <span className="b-ok">انتشار‌یافته</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* صفحه‌بندی */}
          {pages > 1 && (
            <div className="flex gap-2 justify-center items-center mt-6 flex-wrap">
              {page > 1 && <button className="btn-g btn-sm" onClick={() => setPage(page - 1)}>→ قبلی</button>}
              {Array.from({ length: Math.min(7, pages) }, (_, i) => {
                const p = pages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= pages - 3 ? pages - 6 + i : page - 3 + i;
                return <button key={p} className={`btn ${p === page ? 'btn-p' : 'btn-g'} btn-sm`} onClick={() => setPage(p)}>{fa(p)}</button>;
              })}
              {page < pages && <button className="btn-g btn-sm" onClick={() => setPage(page + 1)}>بعدی ←</button>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
