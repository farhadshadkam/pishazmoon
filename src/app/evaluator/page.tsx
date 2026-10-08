'use client';
import { get, fa } from '@/lib/client';
import { useEffect, useState, useCallback } from 'react';

type Tab = 'review' | 'stats' | 'profile';

export default function EvaluatorPanel() {
  const [tab, setTab] = useState<Tab>('review');
  const [userInfo, setUserInfo] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('PA_AD');
    if (!token) { location.href = '/admin/login'; return; }

    // دریافت اطلاعات ارزیاب
    fetch('/api/evaluator/me', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => {
      if (r.status === 401 || r.status === 403) {
        localStorage.removeItem('PA_AD');
        location.href = '/admin/login';
        return null;
      }
      return r.json();
    }).then(d => {
      if (d) { setUserInfo(d); setAuthChecked(true); }
    });
  }, []);

  if (!authChecked) return <p className="text-center py-20">در حال بررسی دسترسی...</p>;

  return (
    <div dir="rtl" className="min-h-screen bg-[#F6F7FB]">
      {/* هدر اختصاصی ارزیاب */}
      <header className="sticky top-0 z-50 bg-[#141E4D] text-white">
        <div className="max-w-[1000px] mx-auto flex items-center gap-3 py-3 px-4">
          <span className="text-lg font-extrabold">📋 پنل ارزیاب</span>
          <span className="b-info">{userInfo?.groupName}</span>
          <span className="mr-auto text-sm">👤 {userInfo?.name}</span>
          <button
            className="btn-g btn-sm"
            onClick={() => { localStorage.removeItem('PA_AD'); location.href = '/'; }}
          >خروج</button>
        </div>
        {/* تب‌ها */}
        <div className="max-w-[1000px] mx-auto flex gap-1 px-4 pb-2">
          <button
            className={`px-4 py-1.5 rounded-t-lg text-sm font-bold ${tab === 'review' ? 'bg-white text-[#141E4D]' : 'text-[#8892C9] hover:text-white'}`}
            onClick={() => setTab('review')}
          >📝 بازبینی سوالات</button>
          <button
            className={`px-4 py-1.5 rounded-t-lg text-sm font-bold ${tab === 'stats' ? 'bg-white text-[#141E4D]' : 'text-[#8892C9] hover:text-white'}`}
            onClick={() => setTab('stats')}
          >📊 کارکرد من</button>
          <button
            className={`px-4 py-1.5 rounded-t-lg text-sm font-bold ${tab === 'profile' ? 'bg-white text-[#141E4D]' : 'text-[#8892C9] hover:text-white'}`}
            onClick={() => setTab('profile')}
          >👤 پروفایل</button>
        </div>
      </header>

      {/* محتوا */}
      <main className="max-w-[1000px] mx-auto px-4 py-6">
        {tab === 'review' && <ReviewTab />}
        {tab === 'stats' && <StatsTab />}
        {tab === 'profile' && <ProfileTab userInfo={userInfo} onUpdate={setUserInfo} />}
      </main>
    </div>
  );
}

/* ═══════════ تب بازبینی سوالات ═══════════ */
function ReviewTab() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editingQ, setEditingQ] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const token = typeof window !== 'undefined' ? localStorage.getItem('PA_AD') : '';

  const load = useCallback(async () => {
    setLoading(true);
    const d = await fetch(`/api/evaluator/questions?status=PENDING&page=${page}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json());
    setQuestions(d.items || []);
    setTotal(d.total || 0);
    setLoading(false);
  }, [page, token]);

  useEffect(() => { load(); }, [load]);

  const review = async (questionId: string, action: string) => {
    await fetch('/api/evaluator/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ questionId, action }),
    });
    setQuestions(qs => qs.filter(q => q.id !== questionId));
    setTotal(t => t - 1);
  };

  const startEdit = (q: any) => {
    setEditingQ(q.id);
    setEditForm({ text: q.text, options: [...q.opt], correct: q.correct, difficulty: q.difficulty, cognitive: q.cognitive });
  };

  const saveEdit = async () => {
    // ذخیره اصلاحات
    await fetch(`/api/evaluator/questions/${editingQ}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(editForm),
    });
    // ثبت به‌عنوان EDITED
    await review(editingQ!, 'EDITED');
    setEditingQ(null);
    load();
  };

  const pages = Math.max(1, Math.ceil(total / 20));

  return (
    <div>
      <p className="text-sm text-slate-400 mb-3">{fa(total)} سوال در انتظار بازبینی شما</p>

      {loading ? <p className="text-center py-10">...</p> : questions.length === 0 ? (
        <div className="card text-center border-dashed py-12">
          <div className="text-4xl">✅</div>
          <b>همه سوالات این گروه بازبینی شده‌اند!</b>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div key={q.id} className="card p-4">
                <div className="flex justify-between items-start gap-3 flex-wrap">
                  <div className="flex-1 min-w-[250px]">
                    <div className="flex gap-2 mb-2 flex-wrap">
                      <span className="b-info">{q.chapter?.standard?.title}</span>
                      <span className="b-warn">{q.chapter?.title}</span>
                      <span className="b-gray">{q.cognitive} | {q.difficulty}</span>
                    </div>
                    <p className="text-sm font-bold leading-7">{q.text}</p>
                    <div className="mt-2 space-y-1">
                      {q.opt.map((o: string, i: number) => (
                        <div key={i} className={`text-sm flex gap-2 rounded-lg px-3 py-1.5 ${i === q.correct ? 'bg-emerald-50 text-emerald-700 font-bold' : 'bg-slate-50'}`}>
                          <span className={`h-5 w-5 shrink-0 flex items-center justify-center rounded text-xs font-bold ${i === q.correct ? 'bg-emerald-200' : 'bg-slate-200'}`}>
                            {i === q.correct ? '✓' : ['الف','ب','ج','د'][i]}
                          </span>
                          <span>{o}</span>
                        </div>
                      ))}
                    </div>

                    {/* فرم اصلاح */}
                    {editingQ === q.id && (
                      <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                        <b className="text-sm text-blue-700">✏️ اصلاح سوال:</b>
                        <textarea className="inp !py-2" rows={2} value={editForm.text}
                          onChange={(e: any) => setEditForm({ ...editForm, text: e.target.value })} />
                        {editForm.options?.map((opt: string, i: number) => (
                          <input key={i} className="inp !py-1.5" value={opt}
                            onChange={(e: any) => {
                              const newOpts = [...editForm.options];
                              newOpts[i] = e.target.value;
                              setEditForm({ ...editForm, options: newOpts });
                            }} placeholder={`گزینه ${['الف','ب','ج','د'][i]}`} />
                        ))}
                        <div className="grid grid-cols-2 gap-2">
                          <select className="inp !py-1.5" value={editForm.correct}
                            onChange={(e: any) => setEditForm({ ...editForm, correct: +e.target.value })}>
                            <option value={0}>الف (صحیح)</option>
                            <option value={1}>ب (صحیح)</option>
                            <option value={2}>ج (صحیح)</option>
                            <option value={3}>د (صحیح)</option>
                          </select>
                          <select className="inp !py-1.5" value={editForm.difficulty}
                            onChange={(e: any) => setEditForm({ ...editForm, difficulty: e.target.value })}>
                            <option>آسان</option><option>متوسط</option><option>دشوار</option>
                          </select>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button className="btn-t btn-sm flex-1" onClick={saveEdit}>💾 ذخیره و تأیید</button>
                          <button className="btn-g btn-sm flex-1" onClick={() => setEditingQ(null)}>انصراف</button>
                        </div>
                      </div>
                    )}
                  </div>

                  {editingQ !== q.id && (
                    <div className="flex flex-col gap-2">
                      <button className="btn-t btn-sm" onClick={() => review(q.id, 'APPROVED')}>✔ تأیید</button>
                      <button className="btn-g btn-sm" onClick={() => startEdit(q)}>✏️ اصلاح</button>
                      <button className="btn-d btn-sm" onClick={() => review(q.id, 'REJECTED')}>✖ رد</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {pages > 1 && (
            <div className="flex gap-2 justify-center mt-6">
              {page > 1 && <button className="btn-g btn-sm" onClick={() => setPage(page - 1)}>→ قبلی</button>}
              <span className="b-gray">{fa(page)} از {fa(pages)}</span>
              {page < pages && <button className="btn-g btn-sm" onClick={() => setPage(page + 1)}>بعدی ←</button>}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ═══════════ تب کارکرد ═══════════ */
function StatsTab() {
  const [stats, setStats] = useState<any>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('PA_AD') : '';

  useEffect(() => {
    fetch('/api/evaluator/review', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(setStats);
  }, [token]);

  if (!stats?.summary) return <p className="text-center py-10">...</p>;

  const s = stats.summary;
  const maxDaily = Math.max(...(stats.daily?.map((d: any) => d.total) || [1]), 1);

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="stat text-center"><b>{fa(s.total)}</b><span className="text-xs text-slate-400">کل بازبینی</span></div>
        <div className="stat text-center"><b className="text-emerald-600">{fa(s.approved)}</b><span className="text-xs text-slate-400">تأیید</span></div>
        <div className="stat text-center"><b className="text-rose-600">{fa(s.rejected)}</b><span className="text-xs text-slate-400">رد</span></div>
        <div className="stat text-center"><b className="text-blue-600">{fa(s.edited)}</b><span className="text-xs text-slate-400">اصلاح</span></div>
      </div>

      {stats.daily?.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-sm mb-3">📊 عملکرد روزانه</h3>
          <div className="space-y-2">
            {stats.daily.map((d: any, i: number) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="w-24 text-slate-400">{d.date}</span>
                <div className="flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden flex">
                  <div className="h-full bg-emerald-400 flex items-center justify-end px-1" style={{ width: `${(d.approved / maxDaily) * 100}%` }}>
                    {d.approved > 0 && <span className="text-white text-[10px] font-bold">{fa(d.approved)}</span>}
                  </div>
                  <div className="h-full bg-rose-400 flex items-center justify-end px-1" style={{ width: `${(d.rejected / maxDaily) * 100}%` }}>
                    {d.rejected > 0 && <span className="text-white text-[10px] font-bold">{fa(d.rejected)}</span>}
                  </div>
                  <div className="h-full bg-blue-400 flex items-center justify-end px-1" style={{ width: `${(d.edited / maxDaily) * 100}%` }}>
                    {d.edited > 0 && <span className="text-white text-[10px] font-bold">{fa(d.edited)}</span>}
                  </div>
                </div>
                <span className="w-10 text-slate-400">{fa(d.total)}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-slate-400">
            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-400 rounded"></div>تأیید</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-rose-400 rounded"></div>رد</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-400 rounded"></div>اصلاح</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════ تب پروفایل ═══════════ */
function ProfileTab({ userInfo, onUpdate }: { userInfo: any; onUpdate: (u: any) => void }) {
  const [name, setName] = useState(userInfo?.name || '');
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [msg, setMsg] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('PA_AD') : '';

  const saveProfile = async () => {
    setMsg('');
    const r = await fetch('/api/evaluator/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, oldPassword: oldPass, newPassword: newPass }),
    }).then(r => r.json());

    if (r.ok) {
      setMsg('✅ پروفایل به‌روزرسانی شد');
      onUpdate({ ...userInfo, name });
      setOldPass(''); setNewPass('');
    } else {
      setMsg(r.error === 'WRONG_PASSWORD' ? 'رمز فعلی نادرست است' : 'خطا در ذخیره');
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="card">
        <h3 className="font-bold mb-4">👤 پروفایل</h3>

        <div className="mb-3">
          <label className="text-xs font-bold">نام و نام خانوادگی</label>
          <input className="inp" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="mb-3">
          <label className="text-xs font-bold">ایمیل (قابل تغییر نیست)</label>
          <input className="inp" dir="ltr" value={userInfo?.email || ''} disabled style={{ opacity: 0.6 }} />
        </div>

        <div className="mb-3">
          <label className="text-xs font-bold">گروه برنامه‌ریزی درسی (تخصیص‌یافته توسط ادمین)</label>
          <input className="inp" value={userInfo?.groupName || ''} disabled style={{ opacity: 0.6 }} />
        </div>

        <hr className="my-4 border-slate-200" />

        <h4 className="font-bold text-sm mb-3">🔑 تغییر رمز عبور</h4>

        <div className="mb-3">
          <label className="text-xs font-bold">رمز فعلی</label>
          <input className="inp" type="password" dir="ltr" value={oldPass} onChange={(e) => setOldPass(e.target.value)} />
        </div>

        <div className="mb-3">
          <label className="text-xs font-bold">رمز جدید (خالی = بدون تغییر)</label>
          <input className="inp" type="password" dir="ltr" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
        </div>

        <p className="text-sm min-h-5">{msg}</p>

        <button className="btn-p w-full !py-3" onClick={saveProfile}>💾 ذخیره</button>
      </div>
    </div>
  );
}
