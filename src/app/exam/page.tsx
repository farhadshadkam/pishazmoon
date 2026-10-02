'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Item = { qid: string; ch: string; w: number; text: string; options: string[] };
type Start = { attemptToken: string; deadline: string; items: Item[]; answers: Record<string, number>; error?: string };

export default function ExamPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [token, setToken] = useState('');
  const [deadline, setDeadline] = useState(0);
  const [cur, setCur] = useState(0);
  const [ans, setAns] = useState<Record<string, number>>({});
  const [remain, setRemain] = useState(0);
  const [err, setErr] = useState('');
  const done = useRef(false);

  useEffect(() => { (async () => {
    const entry = JSON.parse(sessionStorage.getItem('PA_ENTRY') || 'null');
    if (!entry) return router.replace('/exam-entry');
    const r = await fetch('/api/exam/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry) });
    const d: Start = await r.json();
    if (!r.ok) return setErr(d.error === 'BANK_INCOMPLETE' ? 'بانک در حال تکمیل است.' : 'خطا');
    setItems(d.items); setToken(d.attemptToken); setAns(d.answers || {}); setDeadline(Date.parse(d.deadline));
  })(); }, [router]);

  useEffect(() => { if (!deadline) return;
    const t = setInterval(() => { const s = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setRemain(s); if (s <= 0) submit(true); }, 1000);
    return () => clearInterval(t); }, [deadline]);

  async function answer(qid: string, i: number) {
    setAns((a) => ({ ...a, [qid]: i }));
    fetch('/api/exam/answer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ attemptToken: token, qid, selected: i }) });
  }
  async function submit(auto = false) {
    if (done.current || !token) return; done.current = true;
    const r = await fetch('/api/exam/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ attemptToken: token, auto }) });
    const d = await r.json();
    router.push(`/report/${d.attemptId}`);
  }

  if (err) return <main dir="rtl" className="max-w-md p-10 mx-auto text-center"><p className="text-lg font-bold text-rose-600">{err}</p></main>;
  if (!items.length) return <p className="p-10 text-center">در حال آماده‌سازی…</p>;
  const it = items[cur], mm = String(Math.floor(remain / 60)).padStart(2, '0'), ss = String(remain % 60).padStart(2, '0');

  return (
    <main dir="rtl" className="max-w-5xl mx-auto p-4">
      <div className="sticky top-0 z-10 flex items-center gap-3 rounded-2xl bg-white p-3 shadow">
        <span className={`rounded-xl px-4 py-1 font-extrabold tabular-nums ${remain <= 300 ? 'animate-pulse bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-800'}`}>{mm}:{ss}</span>
        <div className="h-2 flex-1 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-teal-500" style={{ width: `${(Object.keys(ans).length / items.length) * 100}%` }} /></div>
        <span className="text-xs text-slate-500">{Object.keys(ans).length}/{items.length}</span>
      </div>
      <section className="mt-4 rounded-2xl bg-white p-6 shadow">
        <div className="mb-2 flex justify-between text-xs">
          <span className="rounded-full bg-slate-100 px-3 py-1">{it.ch} — وزن {it.w}</span>
        </div>
        <h2 className="mb-4 text-lg font-bold leading-8">سؤال {cur + 1} از {items.length} — {it.text}</h2>
        {it.options.map((o, i) => (
          <button key={i} onClick={() => answer(it.qid, i)}
            className={`mb-2 flex w-full items-start gap-3 rounded-xl border-2 p-3 text-right transition ${ans[it.qid] === i ? 'border-indigo-900 bg-indigo-50 font-semibold' : 'border-slate-200 hover:border-indigo-500'}`}>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold">{['الف','ب','ج','د'][i]}</span>
            <span>{o}</span>
          </button>
        ))}
        <div className="mt-4 flex justify-between">
          <button disabled={cur === 0} onClick={() => setCur(cur - 1)} className="btn-g">→ قبلی</button>
          {cur === items.length - 1 ? <button onClick={() => submit(false)} className="btn-p font-bold">پایان آزمون</button> : <button onClick={() => setCur(cur + 1)} className="btn-p font-bold">بعدی ←</button>}
        </div>
      </section>
      <aside className="mt-4 grid grid-cols-8 gap-2 rounded-2xl bg-white p-4 shadow sm:grid-cols-10">
        {items.map((x, i) => (
          <button key={x.qid} onClick={() => setCur(i)}
            className={`aspect-square rounded-lg border text-sm font-semibold ${i === cur ? 'ring-2 ring-teal-500' : ''} ${ans[x.qid] !== undefined ? 'border-indigo-500 bg-indigo-50 text-indigo-800' : 'border-slate-200'}`}>{i + 1}</button>
        ))}
        <button onClick={() => submit(false)} className="col-span-full rounded-xl bg-indigo-800 py-2 text-sm font-bold text-white">پایان آزمون</button>
      </aside>
    </main>
  );
}
