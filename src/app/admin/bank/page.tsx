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
        {tab === 'pending' && <QuestionsTab key={`p-${refreshKey}`} status="PENDING" onRefresh={() => setRefreshKey(k => k + 1)} />}
        {tab === 'published' && <QuestionsTab key={`f-${refreshKey}`} status="PUBLISHED" onRefresh={() => setRefreshKey(k => k + 1)} />}
      </div>
    </AdminShell>
  );
}

/* ═══════════════════════════════════════════
   تب استانداردها
   ═══════════════════════════════════════════ */
function StatsTab({ onRefresh }: { onRefresh: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showList, setShowList] = useState(false);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [profFilter, setProfFilter] = useState('');
  const [jobFilter, setJobFilter] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const load = useCallback(async () => {
    setLoading(true);
    const d = await get('/admin/bank/stats', true);
    setData(d);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const groups = useMemo(() => {
    if (!data?.standards) return [];
    return [...new Set(data.standards.map((s: any) => s.groupName))];
  }, [data]);

  const professions = useMemo(() => {
    if (!data?.standards || !groupFilter) return [];
    return [...new Set(data.standards.filter((s: any) => s.groupName === groupFilter).map((s: any) => s.profession))];
  }, [data, groupFilter]);

  const jobs = useMemo(() => {
    if (!data?.standards || !groupFilter || !profFilter) return [];
    return [...new Set(data.standards.filter((s: any) => s.groupName === groupFilter && s.profession === profFilter).map((s: any) => s.job))];
  }, [data, groupFilter, profFilter]);

  const filtered = useMemo(() => {
    if (!data?.standards) return [];
    return data.standards.filter((s: any) => {
      if (groupFilter && s.groupName !== groupFilter) return false;
      if (profFilter && s.profession !== profFilter) return false;
      if (jobFilter && s.job !== jobFilter) return false;
      if (search) {
        const q = search.trim();
        if (!s.title.includes(q) && !s.code.includes(q)) return false;
      }
      return true;
    });
  }, [data, search, groupFilter, profFilter, jobFilter]);

  const activeStandards = filtered.filter((s: any) => s.published);
  const inactiveStandards = filtered.filter((s: any) => !s.published);

  const api = (method: string, id: string, body?: any) =>
    fetch(`/api/admin/standards/${id}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('PA_AD')}` },
      body: body ? JSON.stringify(body) : undefined,
    });

  const toggleActive = async (id: string, title: string, active: boolean) => {
    if (!confirm(`${active ? 'غیرفعال' : 'فعال'} کردن «${title}»؟`)) return;
    const r = await api('PATCH', id);
    if (r.ok) onRefresh();
  };

  const startEdit = (std: any) => {
    setEditing(std.id);
    setEditForm({ title: std.title, groupName: std.groupName, profession: std.profession, job: std.job, code: std.code });
  };

  const saveEdit = async () => {
    if (!editing) return;
    const r = await api('PUT', editing, editForm);
    if (r.ok) { setEditing(null); onRefresh(); } else alert('خطا در ذخیره');
  };

  if (loading) return <p className="text-center py-10 text-slate-400">در حال بارگذاری...</p>;
  if (!data) return <p className="text-center py-10 text-slate-400">خطا</p>;

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <div className="stat text-center"><b>{fa(data.summary.totalStandards)}</b><span className="text-xs text-slate-400">کل</span></div>
        <div className="stat text-center"><b className="text-emerald-600">{fa(data.summary.totalActive)}</b><span className="text-xs text-slate-400">فعال</span></div>
        <div className="stat text-center"><b className="text-rose-600">{fa(data.summary.totalInactive)}</b><span className="text-xs text-slate-400">غیرفعال</span></div>
        <div className="stat text-center"><b className="text-blue-600">{fa(data.summary.totalPublished)}</b><span className="text-xs text-slate-400">منتشر</span></div>
        <div className="stat text-center"><b className="text-amber-500">{fa(data.summary.totalPending)}</b><span className="text-xs text-slate-400">در انتظار</span></div>
      </div>

      {/* فیلتر */}
      <div className="card p-3 mb-4">
        <div className="flex flex-wrap gap-2 items-center">
          <input className="inp max-w-[200px]" placeholder="🔍 جستجوی عنوان..." value={search} onChange={(e) => { setSearch(e.target.value); setShowList(true); }} />
          <select className="inp max-w-[180px]" value={groupFilter} onChange={(e) => { setGroupFilter(e.target.value); setProfFilter(''); setJobFilter(''); setShowList(true); }}>
            <option value="">همه گروه‌ها</option>
            {groups.map((g: any) => <option key={g}>{g}</option>)}
          </select>
          <select className="inp max-w-[180px]" value={profFilter} onChange={(e) => { setProfFilter(e.target.value); setJobFilter(''); setShowList(true); }} disabled={!groupFilter}>
            <option value="">همه حرفه‌ها</option>
            {professions.map((p: any) => <option key={p}>{p}</option>)}
          </select>
          <select className="inp max-w-[180px]" value={jobFilter} onChange={(e) => { setJobFilter(e.target.value); setShowList(true); }} disabled={!groupFilter || !profFilter}>
            <option value="">همه مشاغل</option>
            {jobs.map((j: any) => <option key={j}>{j}</option>)}
          </select>
          <button className="btn-p btn-sm" onClick={() => setShowList(true)}>📋 نمایش ({fa(filtered.length)})</button>
          <button className="btn-g btn-sm" onClick={() => { setSearch(''); setGroupFilter(''); setProfFilter(''); setJobFilter(''); setShowList(false); }}>🔁 پاک‌سازی</button>
        </div>
      </div>

      {!showList ? (
        <div className="card text-center border-dashed py-12">
          <div className="text-4xl">🗂</div>
          <b>برای مشاهده، فیلتر کنید یا دکمه نمایش را بزنید</b>
          <p className="text-sm text-slate-400 mt-1">({fa(data.summary.totalStandards)} استاندارد ثبت شده)</p>
        </div>
      ) : (
        <>
          {activeStandards.length > 0 && (
            <>
              <h3 className="font-bold text-sm mb-2">🟢 فعال ({fa(activeStandards.length)})</h3>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {activeStandards.map((std: any) => (
                  <StdCard key={std.id} std={std} editing={editing} editForm={editForm} setEditForm={setEditForm}
                    onStartEdit={() => startEdit(std)} onSave={saveEdit} onCancel={() => setEditing(null)}
                    onToggle={() => toggleActive(std.id, std.title, true)} />
                ))}
              </div>
            </>
          )}
          {inactiveStandards.length > 0 && (
            <>
              <h3 className="font-bold text-sm mb-2 text-rose-600">🔴 غیرفعال ({fa(inactiveStandards.length)})</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {inactiveStandards.map((std: any) => (
                  <StdCard key={std.id} std={std} editing={editing} editForm={editForm} setEditForm={setEditForm}
                    onStartEdit={() => startEdit(std)} onSave={saveEdit} onCancel={() => setEditing(null)}
                    onToggle={() => toggleActive(std.id, std.title, false)} />
                ))}
              </div>
            </>
          )}
          {filtered.length === 0 && <div className="card text-center border-dashed py-8"><b>یافت نشد</b></div>}
        </>
      )}
    </div>
  );
}

function StdCard({ std, editing, editForm, setEditForm, onStartEdit, onSave, onCancel, onToggle }: any) {
  const ready = std.totalPublished >= 400;
  const pct = Math.min(100, Math.round((std.totalPublished / Math.max(1, std.totalRequired)) * 100));
  const isEditing = editing === std.id;

  return (
    <div className={`card ${!std.published ? 'opacity-60 border-rose-200' : ''}`}>
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

      {isEditing ? (
        <div className="bg-slate-50 rounded-xl p-4 mt-2 space-y-2">
          <div><label className="text-xs font-bold">عنوان</label><input className="inp !py-1.5" value={editForm.title} onChange={(e: any) => setEditForm({ ...editForm, title: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs font-bold">گروه</label><input className="inp !py-1.5" value={editForm.groupName} onChange={(e: any) => setEditForm({ ...editForm, groupName: e.target.value })} /></div>
            <div><label className="text-xs font-bold">حرفه</label><input className="inp !py-1.5" value={editForm.profession} onChange={(e: any) => setEditForm({ ...editForm, profession: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs font-bold">شغل</label><input className="inp !py-1.5" value={editForm.job} onChange={(e: any) => setEditForm({ ...editForm, job: e.target.value })} /></div>
            <div><label className="text-xs font-bold">کد</label><input className="inp !py-1.5" dir="ltr" value={editForm.code} onChange={(e: any) => setEditForm({ ...editForm, code: e.target.value })} /></div>
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
            {std.published ? '🚫 غیرفعال' : '✅ فعال‌سازی'}
          </button>
        </div>
      )}

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

/* ═══════════════════════════════════════════
   تب سوالات (بازبینی + انتشار‌یافته)
   با فیلتر سلسله‌مراتبی + دکمه اصلاح
   ═══════════════════════════════════════════ */
function QuestionsTab({ status, onRefresh }: { status: 'PENDING' | 'PUBLISHED'; onRefresh: () => void }) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const ps = 20;
  const [q, setQ] = useState('');
  const [g, setG] = useState('');
  const [p, setP] = useState('');
  const [j, setJ] = useState('');
  const [hierOpts, setHierOpts] = useState<any>({ gs: [], ps: [], js: [] });
  const [loading, setLoading] = useState(true);
  const [showList, setShowList] = useState(false);
  const [editingQ, setEditingQ] = useState<string | null>(null);
  const [editQForm, setEditQForm] = useState<any>({});

  const load = useCallback(async () => {
    if (!showList) { setLoading(false); return; }
    setLoading(true);
    const sp = new URLSearchParams({
      status, page: String(page), ps: String(ps),
      ...(q && { q }), ...(g && { g }), ...(p && { p }), ...(j && { j }),
    });
    const d = await get(`/admin/questions/list?${sp}`, true);
    setQuestions(d.items || []);
    setTotal(d.total || 0);
    if (d.hierOpts) setHierOpts(d.hierOpts);
    setLoading(false);
  }, [status, page, q, g, p, j, showList]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [q, g, p, j]);

  const setQuestionStatus = async (id: string, newStatus: string) => {
    await fetch(`/api/admin/questions/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('PA_AD')}` },
      body: JSON.stringify({ status: newStatus }),
    });
    setQuestions((qs) => qs.filter((i) => i.id !== id));
    setTotal((t) => t - 1);
  };

  const startEditQ = (item: any) => {
    setEditingQ(item.id);
    setEditQForm({
      text: item.text,
      options: [...item.opt],
      correct: item.correct,
      difficulty: item.difficulty,
      cognitive: item.cognitive,
    });
  };

  const saveEditQ = async () => {
    if (!editingQ) return;
    const r = await fetch(`/api/admin/questions/${editingQ}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('PA_AD')}` },
      body: JSON.stringify({
        text: editQForm.text,
        options: editQForm.options,
        correct: editQForm.correct,
        difficulty: editQForm.difficulty,
        cognitive: editQForm.cognitive,
      }),
    });
    if (r.ok) {
      setEditingQ(null);
      load(); // رفرش
    } else {
      alert('خطا در ذخیره اصلاحات');
    }
  };

  const approveAll = async () => {
    if (!confirm(`تأیید همه ${fa(questions.length)} سوال این صفحه؟`)) return;
    for (const item of questions) {
      await fetch(`/api/admin/questions/${item.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('PA_AD')}` },
        body: JSON.stringify({ status: 'PUBLISHED' }),
      });
    }
    load();
  };

  const pages = Math.max(1, Math.ceil(total / ps));

  const setHier = (k: string, v: string) => {
    if (k === 'g') { setG(v); setP(''); setJ(''); }
    else if (k === 'p') { setP(v); setJ(''); }
    else setJ(v);
    setShowList(true);
  };

  return (
    <div>
      {/* فیلتر (همان الگوی تب استانداردها) */}
      <div className="card p-3 mb-4">
        <div className="flex flex-wrap gap-2 items-center">
          <input className="inp max-w-[200px]" placeholder="🔍 جستجو در متن..." value={q}
            onChange={(e) => { setQ(e.target.value); setShowList(true); }} />

          <select className="inp max-w-[180px]" value={g} onChange={(e) => setHier('g', e.target.value)}>
            <option value="">همه گروه‌ها</option>
            {hierOpts.gs?.map((x: any) => <option key={x}>{x}</option>)}
          </select>

          <select className="inp max-w-[180px]" value={p} onChange={(e) => setHier('p', e.target.value)} disabled={!g}>
            <option value="">همه حرفه‌ها</option>
            {hierOpts.ps?.map((x: any) => <option key={x}>{x}</option>)}
          </select>

          <select className="inp max-w-[180px]" value={j} onChange={(e) => setHier('j', e.target.value)} disabled={!g || !p}>
            <option value="">همه مشاغل</option>
            {hierOpts.js?.map((x: any) => <option key={x}>{x}</option>)}
          </select>

          <button className="btn-p btn-sm" onClick={() => setShowList(true)}>📋 نمایش ({fa(total)})</button>
          <button className="btn-g btn-sm" onClick={() => { setQ(''); setG(''); setP(''); setJ(''); setShowList(false); }}>🔁 پاک‌سازی</button>

          {status === 'PENDING' && showList && questions.length > 0 && (
            <button className="btn-t btn-sm" onClick={approveAll}>⚡ تأیید همه ({fa(questions.length)})</button>
          )}
        </div>
      </div>

      {/* حالت خالی */}
      {!showList ? (
        <div className="card text-center border-dashed py-12">
          <div className="text-4xl">{status === 'PENDING' ? '⏳' : '✅'}</div>
          <b>برای مشاهده سوالات، فیلتر کنید یا دکمه نمایش را بزنید</b>
        </div>
      ) : loading ? (
        <p className="text-center py-10 text-slate-400">در حال بارگذاری...</p>
      ) : questions.length === 0 ? (
        <div className="card text-center border-dashed py-12">
          <b>سوالی یافت نشد</b>
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
                      <span className="b-gray">{item.cognitive} | {item.difficulty}</span>
                    </div>

                    {/* متن سوال */}
                    <p className="text-sm font-bold leading-7">{item.text}</p>

                    {/* گزینه‌ها */}
                    <div className="mt-2 space-y-1">
                      {item.opt.map((o: string, i: number) => (
                        <div key={i} className={`text-sm flex gap-2 rounded-lg px-3 py-1.5 ${
                          i === item.correct ? 'bg-emerald-50 text-emerald-700 font-bold' : 'bg-slate-50'
                        }`}>
                          <span className={`h-5 w-5 shrink-0 flex items-center justify-center rounded text-xs font-bold ${
                            i === item.correct ? 'bg-emerald-200' : 'bg-slate-200'
                          }`}>{i === item.correct ? '✓' : ['الف','ب','ج','د'][i]}</span>
                          <span>{o}</span>
                        </div>
                      ))}
                    </div>

                    {/* فرم اصلاح */}
                    {editingQ === item.id && (
                      <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                        <b className="text-sm text-blue-700">✏️ اصلاح سوال:</b>
                        <div>
                          <label className="text-xs font-bold">متن سوال</label>
                          <textarea className="inp !py-2" rows={2} value={editQForm.text}
                            onChange={(e: any) => setEditQForm({ ...editQForm, text: e.target.value })} />
                        </div>
                        {editQForm.options?.map((opt: string, i: number) => (
                          <div key={i}>
                            <label className={`text-xs font-bold ${editQForm.correct === i ? 'text-emerald-600' : ''}`}>
                              گزینه {['الف','ب','ج','د'][i]} {editQForm.correct === i ? '(صحیح)' : ''}
                            </label>
                            <input className="inp !py-1.5" value={opt}
                              onChange={(e: any) => {
                                const newOpts = [...editQForm.options];
                                newOpts[i] = e.target.value;
                                setEditQForm({ ...editQForm, options: newOpts });
                              }} />
                          </div>
                        ))}
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-xs font-bold">گزینه صحیح</label>
                            <select className="inp !py-1.5" value={editQForm.correct}
                              onChange={(e: any) => setEditQForm({ ...editQForm, correct: +e.target.value })}>
                              <option value={0}>الف</option>
                              <option value={1}>ب</option>
                              <option value={2}>ج</option>
                              <option value={3}>د</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-bold">دشواری</label>
                            <select className="inp !py-1.5" value={editQForm.difficulty}
                              onChange={(e: any) => setEditQForm({ ...editQForm, difficulty: e.target.value })}>
                              <option>آسان</option>
                              <option>متوسط</option>
                              <option>دشوار</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-bold">سطح شناختی</label>
                            <select className="inp !py-1.5" value={editQForm.cognitive}
                              onChange={(e: any) => setEditQForm({ ...editQForm, cognitive: e.target.value })}>
                              <option>یادآوری</option>
                              <option>فهم</option>
                              <option>کاربرد</option>
                              <option>تحلیل</option>
                              <option>ارزیابی</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button className="btn-t btn-sm flex-1" onClick={saveEditQ}>💾 ذخیره اصلاحات</button>
                          <button className="btn-g btn-sm flex-1" onClick={() => setEditingQ(null)}>انصراف</button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* دکمه‌ها */}
                  {editingQ !== item.id && (
                    <div className="flex flex-col gap-2">
                      {status === 'PENDING' ? (
                        <>
                          <button className="btn-t btn-sm" onClick={() => setQuestionStatus(item.id, 'PUBLISHED')}>✔ تأیید</button>
                          <button className="btn-g btn-sm" onClick={() => startEditQ(item)}>✏️ اصلاح</button>
                          <button className="btn-d btn-sm" onClick={() => setQuestionStatus(item.id, 'REJECTED')}>✖ رد</button>
                        </>
                      ) : (
                        <>
                          <button className="btn-g btn-sm" onClick={() => startEditQ(item)}>✏️ اصلاح</button>
                          <button className="btn-g btn-sm" onClick={() => setQuestionStatus(item.id, 'PENDING')}>↩ بازگشت</button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* صفحه‌بندی */}
          {pages > 1 && (
            <div className="flex gap-2 justify-center mt-6 flex-wrap">
              {page > 1 && <button className="btn-g btn-sm" onClick={() => setPage(page - 1)}>→ قبلی</button>}
              {Array.from({ length: Math.min(7, pages) }, (_, i) => {
                const pp = pages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= pages - 3 ? pages - 6 + i : page - 3 + i;
                return <button key={pp} className={`btn ${pp === page ? 'btn-p' : 'btn-g'} btn-sm`} onClick={() => setPage(pp)}>{fa(pp)}</button>;
              })}
              {page < pages && <button className="btn-g btn-sm" onClick={() => setPage(page + 1)}>بعدی ←</button>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
