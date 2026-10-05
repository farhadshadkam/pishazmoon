'use client';
import AdminShell from '@/components/AdminShell';
import { get, fa } from '@/lib/client';
import { useEffect, useState, useCallback, useMemo } from 'react';

type Tab = 'stats' | 'pending' | 'published';

export default function AdminBank() {
  const [tab, setTab] = useState<Tab>('stats');
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <AdminShell title="🏦 بانک سوالات">
      <div dir="rtl">
        <div className="flex gap-2 mb-4 flex-wrap">
          <button className={`btn ${tab === 'stats' ? 'btn-p' : 'btn-g'} btn-sm`} onClick={() => setTab('stats')}>📊 استانداردها</button>
          <button className={`btn ${tab === 'pending' ? 'btn-p' : 'btn-g'} btn-sm`} onClick={() => setTab('pending')}>⏳ بازبینی</button>
          <button className={`btn ${tab === 'published' ? 'btn-p' : 'btn-g'} btn-sm`} onClick={() => setTab('published')}>✅ انتشار‌یافته</button>
          <a href="/admin/gen" className="btn-t btn-sm mr-auto">📥 ایمپورت</a>
        </div>

        {tab === 'stats' && <StatsTab key={refreshKey} onRefresh={() => setRefreshKey(k => k + 1)} />}
        {tab === 'pending' && <QuestionsTab key={`p-${refreshKey}`} status="PENDING" />}
        {tab === 'published' && <QuestionsTab key={`f-${refreshKey}`} status="PUBLISHED" />}
      </div>
    </AdminShell>
  );
}

/* ═══════════ تب استانداردها (با فیلتر) ═══════════ */
function StatsTab({ onRefresh }: { onRefresh: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showList, setShowList] = useState(false);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const load = useCallback(async () => {
    setLoading(true);
    const d = await get('/admin/bank/stats', true);
    setData(d);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // لیست گروه‌ها از داده
  const groups = useMemo(() => {
    if (!data?.standards) return [];
    return [...new Set(data.standards.map((s: any) => s.groupName))];
  }, [data]);

  // فیلتر
  const filtered = useMemo(() => {
    if (!data?.standards) return [];
    return data.standards.filter((s: any) => {
      if (groupFilter && s.groupName !== groupFilter) return false;
      if (search) {
        const q = search.trim();
        if (!s.title.includes(q) && !s.code.includes(q) && !s.job.includes(q)) return false;
      }
      return true;
    });
  }, [data, search, groupFilter]);

  const activeStandards = filtered.filter((s: any) => s.published);
  const inactiveStandards = filtered.filter((s: any) => !s.published);

  // ── عملیات ──

  const api = (method: string, id: string, body?: any) =>
    fetch(`/api/admin/standards/${id}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('PA_AD')}` },
      body: body ? JSON.stringify(body) : undefined,
    });

  const toggleActive = async (id: string, title: string, currentlyActive: boolean) => {
    const action = currentlyActive ? 'غیرفعال' : 'فعال';
    if (!confirm(`آیا از ${action} کردن «${title}» مطمئن هستید؟`)) return;
    const r = await api('PATCH', id);
    if (r.ok) { onRefresh(); } else { alert('خطا!'); }
  };

  const startEdit = (std: any) => {
    setEditing(std.id);
    setEditForm({ title: std.title, groupName: std.groupName, profession: std.profession, job: std.job, code: std.code, hours: std.totalRequired / 10 });
  };

  const saveEdit = async () => {
    if (!editing) return;
    const r = await api('PUT', editing, editForm);
    if (r.ok) { setEditing(null); onRefresh(); } else { alert('خطا در ذخیره'); }
  };

  const deleteStandard = async (id: string, title: string) => {
    if (!confirm(`⚠️ حذف کامل «${title}»؟\n\nاین عمل قابل بازگشت نیست!\سوالات بانک حفظ می‌شوند.`)) return;
    if (!confirm(`مطمئن هستید؟ برای تأیید نهایی OK را بزنید.`)) return;
    const r = await api('DELETE', id);
    if (r.ok) { onRefresh(); }
  };

  if (loading) return <p className="text-center py-10 text-slate-400">در حال بارگذاری...</p>;
  if (!data) return <p className="text-center py-10 text-slate-400">خطا</p>;

  return (
    <div>
      {/* خلاصه */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <div className="stat text-center"><b>{fa(data.summary.totalStandards)}</b><span className="text-xs text-slate-400">کل</span></div>
        <div className="stat text-center"><b className="text-emerald-600">{fa(data.summary.totalActive)}</b><span className="text-xs text-slate-400">فعال</span></div>
        <div className="stat text-center"><b className="text-rose-600">{fa(data.summary.totalInactive)}</b><span className="text-xs text-slate-400">غیرفعال</span></div>
        <div className="stat text-center"><b className="text-blue-600">{fa(data.summary.totalPublished)}</b><span className="text-xs text-slate-400">سوال منتشر</span></div>
        <div className="stat text-center"><b className="text-amber-500">{fa(data.summary.totalPending)}</b><span className="text-xs text-slate-400">در انتظار</span></div>
      </div>

      {/* نوار فیلتر */}
      <div className="card p-3 mb-4">
        <div className="flex flex-wrap gap-2 items-center">
          <input className="inp max-w-[250px]" placeholder="🔍 جستجوی استاندارد..." value={search} onChange={(e) => { setSearch(e.target.value); setShowList(true); }} />
          <select className="inp max-w-[200px]" value={groupFilter} onChange={(e) => { setGroupFilter(e.target.value); setShowList(true); }}>
            <option value="">همه گروه‌ها</option>
            {groups.map((g: string) => <option key={g}>{g}</option>)}
          </select>
          <button className="btn-p btn-sm" onClick={() => setShowList(true)}>📋 نمایش ({fa(filtered.length)})</button>
          <button className="btn-g btn-sm" onClick={() => { setSearch(''); setGroupFilter(''); setShowList(false); }}>🔁 پاک‌سازی</button>
        </div>
      </div>

      {/* حالت خالی (پیش‌فرض) */}
      {!showList ? (
        <div className="card text-center border-dashed py-12">
          <div className="text-4xl">🗂</div>
          <b>برای مشاهده استانداردها، فیلتر کنید یا دکمه نمایش را بزنید</b>
          <p className="text-sm text-slate-400 mt-1">({fa(data.summary.totalStandards)} استاندارد ثبت شده)</p>
        </div>
      ) : (
        <>
          {/* استانداردهای فعال */}
          {activeStandards.length > 0 && (
            <>
              <h3 className="font-bold text-sm mb-2">🟢 استانداردهای فعال ({fa(activeStandards.length)})</h3>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {activeStandards.map((std: any) => (
                  <StandardCard key={std.id} std={std} editing={editing} editForm={editForm}
                    setEditForm={setEditForm} onStartEdit={() => startEdit(std)}
                    onSave={saveEdit} onCancel={() => setEditing(null)}
                    onToggle={() => toggleActive(std.id, std.title, true)}
                    onDelete={() => deleteStandard(std.id, std.title)} />
                ))}
              </div>
            </>
          )}

          {/* استانداردهای غیرفعال */}
          {inactiveStandards.length > 0 && (
            <>
              <h3 className="font-bold text-sm mb-2 text-rose-600">🔴 استانداردهای غیرفعال ({fa(inactiveStandards.length)})</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {inactiveStandards.map((std: any) => (
                  <StandardCard key={std.id} std={std} editing={editing} editForm={editForm}
                    setEditForm={setEditForm} onStartEdit={() => startEdit(std)}
                    onSave={saveEdit} onCancel={() => setEditing(null)}
                    onToggle={() => toggleActive(std.id, std.title, false)}
                    onDelete={() => deleteStandard(std.id, std.title)} />
                ))}
              </div>
            </>
          )}

          {filtered.length === 0 && (
            <div className="card text-center border-dashed py-8"><b>نتیجه‌ای یافت نشد</b></div>
          )}
        </>
      )}
    </div>
  );
}

/* ── کارت استاندارد ── */
function StandardCard({ std, editing, editForm, setEditForm, onStartEdit, onSave, onCancel, onToggle, onDelete }: any) {
  const ready = std.totalPublished >= 400;
  const pct = Math.min(100, Math.round((std.totalPublished / Math.max(1, std.totalRequired)) * 100));
  const isEditing = editing === std.id;

  return (
    <div className={`card ${!std.published ? 'opacity-60 border-rose-200 bg-rose-50/30' : ''}`}>
      <div className="flex justify-between items-start gap-2 flex-wrap mb-2">
        <div className="flex-1 min-w-[200px]">
          <div className="flex gap-2 flex-wrap items-center mb-1">
            {std.published
              ? <span className={ready ? 'b-ok' : 'b-warn'}>{ready ? 'آزمون فعال' : 'در حال تکمیل'}</span>
              : <span className="b-bad">🚫 غیرفعال</span>}
          </div>
          <b className={`text-sm ${!std.published ? 'line-through text-slate-400' : ''}`}>{std.title}</b>
          <p className="text-xs text-slate-400">{std.groupName} › {std.job}</p>
          <code className="text-xs bg-slate-100 px-1.5 rounded mt-1 inline-block">کد {std.code}</code>
        </div>
      </div>

      {/* دکمه‌ها */}
      {isEditing ? (
        <div className="bg-slate-50 rounded-xl p-4 mt-2 space-y-2">
          <div><label className="text-xs font-bold">عنوان</label><input className="inp !py-1.5" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs font-bold">گروه</label><input className="inp !py-1.5" value={editForm.groupName} onChange={(e) => setEditForm({ ...editForm, groupName: e.target.value })} /></div>
            <div><label className="text-xs font-bold">حرفه</label><input className="inp !py-1.5" value={editForm.profession} onChange={(e) => setEditForm({ ...editForm, profession: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs font-bold">شغل</label><input className="inp !py-1.5" value={editForm.job} onChange={(e) => setEditForm({ ...editForm, job: e.target.value })} /></div>
            <div><label className="text-xs font-bold">کد</label><input className="inp !py-1.5" dir="ltr" value={editForm.code} onChange={(e) => setEditForm({ ...editForm, code: e.target.value })} /></div>
          </div>
          <div className="flex gap-2 pt-2">
            <button className="btn-t btn-sm flex-1" onClick={onSave}>💾 ذخیره</button>
            <button className="btn-g btn-sm flex-1" onClick={onCancel}>انصراف</button>
          </div>
        </div>
      ) : (
        <div className="flex gap-1 mt-2 flex-wrap">
          <button className="btn-g btn-sm" onClick={onStartEdit}>✏️ ویرایش</button>
          <button className={`btn-sm ${std.published ? 'btn-d' : 'btn-t'}`} onClick={onToggle}>
            {std.published ? '🚫 غیرفعال کردن' : '✅ فعال‌سازی'}
          </button>
        </div>
      )}

      {/* آمادگی */}
      {!isEditing && (
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">سوالات منتشرشده</span>
            <b>{fa(std.totalPublished)} / {fa(std.totalRequired)}</b>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: ready ? '#16A34A' : pct >= 50 ? '#F5A623' : '#E11D48' }} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════ تب سوالات ═══════════ */
function QuestionsTab({ status }: { status: 'PENDING' | 'PUBLISHED' }) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const ps = 20;
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const sp = new URLSearchParams({ status, page: String(page), ps: String(ps), ...(q && { q }) });
    const d = await get(`/admin/questions/list?${sp}`, true);
    setQuestions(d.items || []);
    setTotal(d.total || 0);
    setLoading(false);
  }, [status, page, q]);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id: string, newStatus: string) => {
    await fetch(`/api/admin/questions/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('PA_AD')}` },
      body: JSON.stringify({ status: newStatus }),
    });
    setQuestions((qs) => qs.filter((i) => i.id !== id));
    setTotal((t) => t - 1);
  };

  const pages = Math.max(1, Math.ceil(total / ps));

  return (
    <div>
      <div className="flex flex-wrap gap-2 my-3">
        <input className="inp max-w-[250px]" placeholder="🔍 جستجو..." value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        {status === 'PENDING' && questions.length > 0 && (
          <button className="btn-t btn-sm" onClick={async () => {
            if (!confirm(`تأیید همه ${fa(questions.length)} سوال؟`)) return;
            for (const item of questions) await setStatus(item.id, 'PUBLISHED');
            load();
          }}>⚡ تأیید همه</button>
        )}
      </div>

      <p className="text-sm text-slate-400 mb-3">{fa(total)} سوال</p>

      {loading ? <p className="text-center py-10 text-slate-400">...</p> : questions.length === 0 ? (
        <div className="card text-center border-dashed py-12"><b>موردی یافت نشد</b></div>
      ) : (
        <>
          <div className="space-y-3">
            {questions.map((item, idx) => (
              <div key={item.id} className="card p-4">
                <div className="flex justify-between items-start gap-3 flex-wrap">
                  <div className="flex-1 min-w-[250px]">
                    <div className="flex gap-2 mb-2 flex-wrap">
                      <span className="b-info">{item.chapter?.standard?.title}</span>
                      <span className="b-warn">{item.chapter?.title}</span>
                      <span className="b-gray">{item.cognitive} | {item.difficulty}</span>
                    </div>
                    <p className="text-sm font-bold leading-7">{item.text}</p>
                    <div className="mt-2 space-y-1">
                      {item.opt.map((o: string, i: number) => (
                        <div key={i} className={`text-sm flex gap-2 rounded-lg px-3 py-1.5 ${i === item.correct ? 'bg-emerald-50 text-emerald-700 font-bold' : 'bg-slate-50'}`}>
                          <span className={`h-5 w-5 shrink-0 flex items-center justify-center rounded text-xs font-bold ${i === item.correct ? 'bg-emerald-200' : 'bg-slate-200'}`}>
                            {i === item.correct ? '✓' : ['الف','ب','ج','د'][i]}
                          </span>
                          <span>{o}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {status === 'PENDING' ? (
                      <>
                        <button className="btn-t btn-sm" onClick={() => setStatus(item.id, 'PUBLISHED')}>✔ تأیید</button>
                        <button className="btn-d btn-sm" onClick={() => setStatus(item.id, 'REJECTED')}>✖ رد</button>
                      </>
                    ) : (
                      <button className="btn-g btn-sm" onClick={() => setStatus(item.id, 'PENDING')}>↩ بازگشت</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pages > 1 && (
            <div className="flex gap-2 justify-center mt-6 flex-wrap">
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
