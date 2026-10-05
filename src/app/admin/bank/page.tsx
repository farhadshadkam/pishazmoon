'use client';
import AdminShell from '@/components/AdminShell';
import { get, post, fa } from '@/lib/client';
import { useEffect, useState, useCallback } from 'react';

type Tab = 'stats' | 'pending' | 'published';

export default function AdminBank() {
  const [tab, setTab] = useState<Tab>('stats');
  const [refreshKey, setRefreshKey] = useState(0);

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

        {tab === 'stats' && <StatsTab key={refreshKey} onRefresh={() => setRefreshKey(k => k + 1)} />}
        {tab === 'pending' && <QuestionsTab key={`p-${refreshKey}`} status="PENDING" />}
        {tab === 'published' && <QuestionsTab key={`f-${refreshKey}`} status="PUBLISHED" />}
      </div>
    </AdminShell>
  );
}

/* ═══════════════════════════════════════════
   تب آمار بانک + مدیریت استانداردها
   ═══════════════════════════════════════════ */
function StatsTab({ onRefresh }: { onRefresh: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const load = useCallback(async () => {
    setLoading(true);
    const d = await get('/admin/bank/stats', true);
    setData(d);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── عملیات مدیریت ──

  const toggleStandard = async (id: string, current: boolean) => {
    const action = current ? 'غیرفعال' : 'فعال';
    if (!confirm(`آیا از ${action} کردن این استاندارد مطمئن هستید؟`)) return;
    const r = await fetch(`/api/admin/standards/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('PA_AD')}`,
      },
    });
    if (r.ok) { onRefresh(); } else { alert('خطا در تغییر وضعیت'); }
  };

  const startEdit = (std: any) => {
    setEditing(std.id);
    setEditForm({
      title: std.title,
      groupName: std.groupName,
      profession: std.profession,
      job: std.job,
      code: std.code,
      hours: std.hours,
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    const r = await fetch(`/api/admin/standards/${editing}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('PA_AD')}`,
      },
      body: JSON.stringify(editForm),
    });
    if (r.ok) {
      setEditing(null);
      onRefresh();
    } else {
      alert('خطا در ذخیره');
    }
  };

  const deleteStandard = async (id: string, title: string) => {
    if (!confirm(`⚠️ حذف «${title}»؟\n\nاستاندارد غیرفعال می‌شود و از صفحه اصلی حذف می‌گردد.\nسوالات بانک حفظ می‌شوند.`)) return;
    const r = await fetch(`/api/admin/standards/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('PA_AD')}`,
      },
    });
    if (r.ok) { onRefresh(); } else { alert('خطا در حذف'); }
  };

  // ── نمایش ──

  if (loading) return <p className="text-center py-10 text-slate-400">در حال بارگذاری...</p>;
  if (!data) return <p className="text-center py-10 text-slate-400">خطا در دریافت داده</p>;

  const { standards, summary } = data;

  return (
    <div>
      {/* کارت‌های خلاصه */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="stat text-center"><b>{fa(summary.totalStandards)}</b><span className="text-xs text-slate-400">استاندارد</span></div>
        <div className="stat text-center"><b className="text-emerald-600">{fa(summary.totalPublished)}</b><span className="text-xs text-slate-400">انتشار‌یافته</span></div>
        <div className="stat text-center"><b className="text-amber-500">{fa(summary.totalPending)}</b><span className="text-xs text-slate-400">در انتظار</span></div>
        <div className="stat text-center"><b className="text-rose-600">{fa(summary.totalRejected)}</b><span className="text-xs text-slate-400">ردشده</span></div>
        <div className="stat text-center"><b className="text-blue-600">{fa(summary.totalRequired)}</b><span className="text-xs text-slate-400">نیاز کل</span></div>
      </div>

      {/* کارت هر استاندارد */}
      {standards.length === 0 ? (
        <div className="card text-center border-dashed py-12">
          <div className="text-4xl">📭</div>
          <b>هنوز استانداردی ثبت نشده</b>
          <p className="text-sm text-slate-400 mt-2">از منوی «ایمپورت سوالات جدید» یک استاندارد اضافه کنید</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {standards.map((std: any) => {
            const ready = std.totalPublished >= 400;
            const pct = Math.min(100, Math.round((std.totalPublished / Math.max(1, std.totalRequired)) * 100));
            const isEditing = editing === std.id;

            return (
              <div key={std.id} className={`card ${!std.published ? 'opacity-60 border-slate-300' : ''}`}>
                {/* وضعیت + بج‌ها */}
                <div className="flex justify-between items-start gap-2 flex-wrap mb-2">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex gap-2 flex-wrap items-center mb-1">
                      <span className={ready ? 'b-ok' : 'b-warn'}>{ready ? 'آزمون فعال' : 'در حال تکمیل'}</span>
                      {!std.published && <span className="b-bad">🚫 غیرفعال</span>}
                    </div>
                    <b className={`text-sm ${!std.published ? 'line-through text-slate-400' : ''}`}>{std.title}</b>
                    <p className="text-xs text-slate-400">{std.groupName} › {std.profession} › {std.job}</p>
                    <code className="text-xs bg-slate-100 px-1.5 rounded mt-1 inline-block">کد {std.code}</code>
                  </div>

                  {/* دکمه‌های مدیریت */}
                  <div className="flex flex-col gap-1">
                    {isEditing ? (
                      <>
                        <button className="btn-t btn-sm" onClick={saveEdit}>💾 ذخیره</button>
                        <button className="btn-g btn-sm" onClick={() => setEditing(null)}>✖ انصراف</button>
                      </>
                    ) : (
                      <>
                        <button className="btn-g btn-sm" onClick={() => startEdit(std)}>✏️ ویرایش</button>
                        <button
                          className={`btn-sm ${std.published ? 'btn-d' : 'btn-t'}`}
                          onClick={() => toggleStandard(std.id, std.published)}
                        >
                          {std.published ? '🚫 غیرفعال' : '✅ فعال‌سازی'}
                        </button>
                        <button className="btn-d btn-sm" onClick={() => deleteStandard(std.id, std.title)}>🗑 حذف</button>
                      </>
                    )}
                  </div>
                </div>

                {/* فرم ویرایش */}
                {isEditing && (
                  <div className="bg-slate-50 rounded-xl p-4 mt-2 mb-3 space-y-2">
                    <div>
                      <label className="text-xs font-bold">عنوان استاندارد</label>
                      <input className="inp !py-1.5" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-bold">گروه برنامه‌ریزی درسی</label>
                        <input className="inp !py-1.5" value={editForm.groupName} onChange={(e) => setEditForm({ ...editForm, groupName: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-xs font-bold">حرفه</label>
                        <input className="inp !py-1.5" value={editForm.profession} onChange={(e) => setEditForm({ ...editForm, profession: e.target.value })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-bold">شغل</label>
                        <input className="inp !py-1.5" value={editForm.job} onChange={(e) => setEditForm({ ...editForm, job: e.target.value })} />
                      </div>
                      <div>
                        <label className="text-xs font-bold">کد استاندارد</label>
                        <input className="inp !py-1.5" dir="ltr" value={editForm.code} onChange={(e) => setEditForm({ ...editForm, code: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold">ساعت آموزش</label>
                      <input className="inp !py-1.5" type="number" value={editForm.hours} onChange={(e) => setEditForm({ ...editForm, hours: +e.target.value })} />
                    </div>
                    <p className="text-xs text-slate-400">⚠️ تغییرات بلافاصله در تمام سامانه (صفحه اصلی، جستجو، بانک سوالات) اعمال می‌شود.</p>
                  </div>
                )}

                {/* نوار آمادگی کلی */}
                {!isEditing && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">آمادگی بانک</span>
                      <b>{fa(std.totalPublished)} / {fa(std.totalRequired)}</b>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{
                        width: `${pct}%`,
                        background: ready ? '#16A34A' : pct >= 50 ? '#F5A623' : '#E11D48',
                      }} />
                    </div>
                  </div>
                )}

                {/* فصل‌ها */}
                {!isEditing && (
                  <div className="mt-3 space-y-1">
                    {std.chapters.map((ch: any, i: number) => {
                      const chPct = Math.min(100, Math.round((ch.published / Math.max(1, ch.required)) * 100));
                      return (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className="w-6 text-slate-400">{fa(i + 1)}.</span>
                          <span className="flex-1 truncate" title={ch.title}>{ch.title}</span>
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{
                              width: `${chPct}%`,
                              background: chPct >= 100 ? '#16A34A' : '#F5A623',
                            }} />
                          </div>
                          <span className="w-16 text-left text-slate-400">{fa(ch.published)}/{fa(ch.required)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* آمار تکمیلی */}
                {!isEditing && (
                  <div className="flex gap-3 mt-3 text-xs text-slate-400 flex-wrap">
                    <span>⏳ در انتظار: <b className="text-amber-500">{fa(std.totalPending)}</b></span>
                    <span>❌ ردشده: <b className="text-rose-500">{fa(std.totalRejected)}</b></span>
                    <span>📚 فصل‌ها: <b>{fa(std.chapters.length)}</b></span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   تب سوالات (بازبینی / انتشار‌یافته)
   ═══════════════════════════════════════════ */
function QuestionsTab({ status }: { status: 'PENDING' | 'PUBLISHED' }) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const ps = 20;
  const [q, setQ] = useState('');
  const [h, setH] = useState({ g: '', p: '', j: '', s: '' });
  const [opts, setOpts] = useState<any>({ gs: [], ps: [], js: [] });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const sp = new URLSearchParams({
      status,
      page: String(page),
      ps: String(ps),
      ...(q && { q }),
      ...h,
    });
    const d = await get(`/admin/questions/list?${sp}`, true);
    setQuestions(d.items || []);
    setTotal(d.total || 0);
    if (d.hierOpts) setOpts(d.hierOpts);
    setLoading(false);
  }, [status, page, q, h]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [q, h]);

  const setQuestionStatus = async (id: string, newStatus: string) => {
    const r = await fetch(`/api/admin/questions/${id}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('PA_AD')}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });
    if (r.ok) {
      setQuestions((qs) => qs.filter((item) => item.id !== id));
      setTotal((t) => t - 1);
    }
  };

  const approveAll = async () => {
    if (!confirm(`تأیید همه ${fa(questions.length)} سوال این صفحه؟`)) return;
    for (const item of questions) {
      await fetch(`/api/admin/questions/${item.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('PA_AD')}`,
        },
        body: JSON.stringify({ status: 'PUBLISHED' }),
      });
    }
    load();
  };

  const pages = Math.max(1, Math.ceil(total / ps));

  const setHier = (k: string, v: string) => {
    if (k === 'g') setH({ g: v, p: '', j: '', s: '' });
    else if (k === 'p') setH({ ...h, p: v, j: '', s: '' });
    else if (k === 'j') setH({ ...h, j: v, s: '' });
    else setH({ ...h, s: v });
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
          <button className="btn-t btn-sm" onClick={approveAll}>⚡ تأیید همه ({fa(questions.length)})</button>
        )}
      </div>

      <p className="text-sm text-slate-400 mb-3">
        {fa(total)} سوال {status === 'PENDING' ? 'در انتظار بازبینی' : 'انتشار‌یافته'}
      </p>

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
                      {item.aiGenerated && <span className="b-info">🤖 AI</span>}
                    </div>
                    <p className="text-sm font-bold leading-7">{item.text}</p>
                    <div className="mt-2 space-y-1">
                      {item.opt.map((o: string, i: number) => (
                        <div key={i} className={`text-sm flex items-start gap-2 rounded-lg px-3 py-1.5 ${
                          i === item.correct ? 'bg-emerald-50 text-emerald-700 font-bold' : 'bg-slate-50'
                        }`}>
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs font-bold ${
                            i === item.correct ? 'bg-emerald-200' : 'bg-slate-200'
                          }`}>
                            {i === item.correct ? '✓' : ['الف', 'ب', 'ج', 'د'][i]}
                          </span>
                          <span>{o}</span>
                        </div>
                      ))}
                    </div>
                    {item.source && <p className="text-xs text-slate-400 mt-2">📍 {item.source}</p>}
                  </div>

                  {/* دکمه‌های عملیات */}
                  <div className="flex flex-col gap-2">
                    {status === 'PENDING' ? (
                      <>
                        <button
                          className="btn-t btn-sm"
                          onClick={() => setQuestionStatus(item.id, 'PUBLISHED')}
                        >✔ تأیید</button>
                        <button
                          className="btn-d btn-sm"
                          onClick={() => setQuestionStatus(item.id, 'REJECTED')}
                        >✖ رد</button>
                      </>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <span className="b-ok text-center">انتشار‌یافته</span>
                        <button
                          className="btn-g btn-sm"
                          onClick={() => setQuestionStatus(item.id, 'PENDING')}
                        >↩ بازگشت به بازبینی</button>
                      </div>
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
                return (
                  <button
                    key={p}
                    className={`btn ${p === page ? 'btn-p' : 'btn-g'} btn-sm`}
                    onClick={() => setPage(p)}
                  >{fa(p)}</button>
                );
              })}
              {page < pages && <button className="btn-g btn-sm" onClick={() => setPage(page + 1)}>بعدی ←</button>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
