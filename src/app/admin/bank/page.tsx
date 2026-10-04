'use client';
import AdminShell from '@/components/AdminShell';
import { get, post, fa } from '@/lib/client';
import { useEffect, useState, useCallback } from 'react';

export default function AdminBank() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<'PENDING' | 'PUBLISHED' | 'ALL'>('PENDING');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const status = filter === 'ALL' ? '' : `?status=${filter}`;
    const d = await get(`/admin/questions/list${status}`, true);
    setQuestions(d.items || []);
    setTotal(d.total || 0);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const approve = async (id: string) => {
    await post(`/admin/questions/${id}/status`, { status: 'PUBLISHED' }, true);
    setQuestions((qs) => qs.filter((q) => q.id !== id));
    setTotal((t) => t - 1);
  };

  const reject = async (id: string) => {
    await post(`/admin/questions/${id}/status`, { status: 'REJECTED' }, true);
    setQuestions((qs) => qs.filter((q) => q.id !== id));
    setTotal((t) => t - 1);
  };

  const approveAll = async () => {
    if (!confirm(`تأیید همه ${fa(questions.length)} سوال؟`)) return;
    for (const q of questions) {
      await post(`/admin/questions/${q.id}/status`, { status: 'PUBLISHED' }, true);
    }
    load();
  };

  return (
    <AdminShell title="🏦 بانک سوالات — بازبینی">
      <div dir="rtl">
        {/* فیلتر */}
        <div className="flex gap-2 mb-4 flex-wrap items-center">
          <button className={`btn ${filter === 'PENDING' ? 'btn-p' : 'btn-g'} btn-sm`} onClick={() => setFilter('PENDING')}>
            ⏳ در انتظار بازبینی
          </button>
          <button className={`btn ${filter === 'PUBLISHED' ? 'btn-p' : 'btn-g'} btn-sm`} onClick={() => setFilter('PUBLISHED')}>
            ✅ انتشار‌یافته
          </button>
          <button className={`btn ${filter === 'ALL' ? 'btn-p' : 'btn-g'} btn-sm`} onClick={() => setFilter('ALL')}>
            📋 همه
          </button>
          <span className="b-gray mr-2">{fa(total)} سوال</span>
          {filter === 'PENDING' && questions.length > 0 && (
            <button className="btn-t btn-sm mr-auto" onClick={approveAll}>
              ⚡ تأیید همه ({fa(questions.length)})
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-center py-10 text-slate-400">در حال بارگذاری...</p>
        ) : questions.length === 0 ? (
          <div className="card text-center border-dashed py-12">
            <div className="text-4xl">{filter === 'PENDING' ? '✅' : '📭'}</div>
            <b>{filter === 'PENDING' ? 'صف بازبینی خالی است — همه سوالات بازبینی شده‌اند!' : 'سوالی یافت نشد'}</b>
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div key={q.id} className="card p-4">
                <div className="flex justify-between items-start gap-3 flex-wrap">
                  <div className="flex-1 min-w-[250px]">
                    <div className="flex gap-2 mb-2 flex-wrap">
                      <span className="b-gray">#{fa(idx + 1)}</span>
                      <span className="b-info">{q.chapter?.standard?.title}</span>
                      <span className="b-warn">{q.chapter?.title}</span>
                      <span className="b-gray">{q.cognitive}</span>
                      <span className="b-gray">{q.difficulty}</span>
                      {q.aiGenerated && <span className="b-info">🤖 AI</span>}
                    </div>
                    <p className="text-sm font-bold leading-7 whitespace-pre-wrap">{q.text}</p>
                    <div className="mt-3 space-y-1.5">
                      {q.opt.map((o: string, i: number) => (
                        <div key={i} className={`text-sm flex items-start gap-2 rounded-lg px-3 py-1.5 ${
                          i === q.correct ? 'bg-emerald-50 text-emerald-700 font-bold' : 'bg-slate-50'
                        }`}>
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs font-bold ${
                            i === q.correct ? 'bg-emerald-200' : 'bg-slate-200'
                          }`}>
                            {i === q.correct ? '✓' : ['الف','ب','ج','د'][i]}
                          </span>
                          <span>{o}</span>
                        </div>
                      ))}
                    </div>
                    {q.source && <p className="text-xs text-slate-400 mt-2">📍 {q.source}</p>}
                  </div>
                  <div className="flex flex-col gap-2">
                    {q.status === 'PENDING' ? (
                      <>
                        <button className="btn-t btn-sm" onClick={() => approve(q.id)}>✔ تأیید</button>
                        <button className="btn-d btn-sm" onClick={() => reject(q.id)}>✖ رد</button>
                      </>
                    ) : (
                      <span className={q.status === 'PUBLISHED' ? 'b-ok' : 'b-bad'}>
                        {q.status === 'PUBLISHED' ? 'انتشار‌یافته' : 'ردشده'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
