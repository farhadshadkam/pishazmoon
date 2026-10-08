'use client';
import { get, fa } from '@/lib/client';
import { useEffect, useState, useCallback } from 'react';

export default function EvaluatorPanel() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editingQ, setEditingQ] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  // بررسی دسترسی
  useEffect(() => {
    const token = localStorage.getItem('PA_AD');
    if (!token) { location.href = '/admin/login'; return; }
    fetch('/api/evaluator/questions?page=1', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => {
      if (r.status === 401) { location.href = '/admin/login'; }
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('PA_AD');
    const [qRes, sRes] = await Promise.all([
      fetch(`/api/evaluator/questions?status=PENDING&page=${page}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/evaluator/review', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]);
    setQuestions(qRes.items || []);
    setTotal(qRes.total || 0);
    setStats(sRes);
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const review = async (questionId: string, action: string) => {
    const token = localStorage.getItem('PA_AD');
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
    const token = localStorage.getItem('PA_AD');
    // ذخیره اصلاحات
    await fetch(`/api/admin/questions/${editingQ}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(editForm),
    });
    // ثبت به‌عنوان EDITED
    await review(editingQ!, 'EDITED');
    setEditingQ(null);
  };

  const pages = Math.max(1, Math.ceil(total / 20));

  return (
    <div dir="rtl" className="max-w-[1000px] mx-auto mt-6">
      <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
        <h1 className="text-2xl font-bold">📋 پنل ارزیاب بانک سوالات</h1>
        <button className="btn-g btn-sm" onClick={() => { localStorage.removeItem('PA_AD'); location.href = '/'; }}>خروج</button>
      </div>

      {/* آمار شخصی */}
      {stats?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="stat text-center"><b>{fa(stats.summary.total)}</b><span className="text-xs text-slate-400">کل بازبینی</span></div>
          <div className="stat text-center"><b className="text-emerald-600">{fa(stats.summary.approved)}</b><span className="text-xs text-slate-400">تأیید</span></div>
          <div className="stat text-center"><b className="text-rose-600">{fa(stats.summary.rejected)}</b><span className="text-xs text-slate-400">رد</span></div>
          <div className="stat text-center"><b className="text-blue-600">{fa(stats.summary.edited)}</b><span className="text-xs text-slate-400">اصلاح</span></div>
        </div>
      )}

      <p className="text-sm text-slate-400 mb-3">{fa(total)} سوال در انتظار بازبینی</p>

      {loading ? <p className="text-center py-10">...</p> : questions.length === 0 ? (
        <div className="card text-center border-dashed py-12"><b>✅ همه سوالات بازبینی شده‌اند!</b></div>
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
                        <textarea className="inp !py-2" rows={2} value={editForm.text} onChange={e => setEditForm({ ...editForm, text: e.target.value })} />
                        {editForm.options?.map((opt: string, i: number) => (
                          <input key={i} className="inp !py-1.5" value={opt} onChange={e => {
                            const newOpts = [...editForm.options]; newOpts[i] = e.target.value;
                            setEditForm({ ...editForm, options: newOpts });
                          }} placeholder={`گزینه ${['الف','ب','ج','د'][i]}`} />
                        ))}
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
