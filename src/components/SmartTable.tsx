'use client';
import { useState, useEffect, useCallback } from 'react';
import { fa, api } from '@/lib/client';

export type Col<T> = { h: string; c: (r: T) => React.ReactNode };
export type Filter = { k: string; l: string; o: [string, string][] };

export default function SmartTable<T extends { id?: string }>({
  endpoint, cols, filters, hier, searchPh, csv,
}: {
  endpoint: string;
  cols: Col<T>[];
  filters?: Filter[];
  hier?: boolean;
  searchPh?: string;
  csv?: string;
}) {
  const [on, setOn] = useState(false);
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [ps, setPs] = useState(10);
  const [q, setQ] = useState('');
  const [f, setF] = useState<Record<string, string>>({});
  const [h, setH] = useState({ g: '', p: '', j: '', s: '' });
  const [opts, setOpts] = useState<any>({ gs: [], ps: [], js: [], ss: [] });

  const load = useCallback(async () => {
    const sp = new URLSearchParams({
      page: String(page),
      ps: ps === 0 ? 'all' : String(ps),
      ...(q && { q }),
      ...f,
      ...h,
    });
    const d = await api<{ items: T[]; total: number; hierOpts?: any }>(`${endpoint}?${sp}`);
    setData(d.items);
    setTotal(d.total);
    if (d.hierOpts) setOpts(d.hierOpts);
  }, [endpoint, page, ps, q, f, h]);

  useEffect(() => { if (on) load(); }, [on, load]);
  useEffect(() => { setPage(1); }, [q, f, h, ps]);

  const setHier = (k: string, v: string) => {
    if (k === 'g') setH({ g: v, p: '', j: '', s: '' });
    else if (k === 'p') setH({ ...h, p: v, j: '', s: '' });
    else if (k === 'j') setH({ ...h, j: v, s: '' });
    else setH({ ...h, s: v });
  };

  const pages = Math.max(1, Math.ceil(total / ps));
  const start = (page - 1) * ps;

  return (
    <div dir="rtl">
      <div className="flex flex-wrap gap-2 items-center my-3">
        <input
          className="inp max-w-[250px]"
          placeholder={searchPh || '🔍 جستجو…'}
          value={q}
          onChange={(e) => { setQ(e.target.value); setOn(true); }}
        />
        {filters?.map((fl) => (
          <select
            key={fl.k}
            className="inp max-w-[165px]"
            value={f[fl.k] || ''}
            onChange={(e) => { setF({ ...f, [fl.k]: e.target.value }); setOn(true); }}
          >
            <option value="">{fl.l}</option>
            {fl.o.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ))}
        {hier && (
          <>
            <select className="inp max-w-[150px]" value={h.g} onChange={(e) => setHier('g', e.target.value)}>
              <option value="">همه گروه‌ها</option>
              {opts.gs?.map((x: string) => <option key={x}>{x}</option>)}
            </select>
            <select className="inp max-w-[150px]" value={h.p} onChange={(e) => setHier('p', e.target.value)} disabled={!h.g}>
              <option value="">همه حرفه‌ها</option>
              {opts.ps?.map((x: string) => <option key={x}>{x}</option>)}
            </select>
            <select className="inp max-w-[150px]" value={h.j} onChange={(e) => setHier('j', e.target.value)} disabled={!h.g || !h.p}>
              <option value="">همه مشاغل</option>
              {opts.js?.map((x: string) => <option key={x}>{x}</option>)}
            </select>
            <select className="inp max-w-[180px]" value={h.s} onChange={(e) => setHier('s', e.target.value)} disabled={!h.g || !h.p || !h.j}>
              <option value="">همه استانداردها</option>
              {opts.ss?.map((x: any) => <option key={x.v} value={x.v}>{x.l}</option>)}
            </select>
          </>
        )}
        <button className="btn-g btn-sm" onClick={() => { setQ(''); setF({}); setH({ g: '', p: '', j: '', s: '' }); }}>🔁</button>
        {on && <button className="btn-g btn-sm" onClick={() => setOn(false)}>بستن</button>}
      </div>

      {!on ? (
        <div className="card text-center border-dashed py-10">
          <div className="text-4xl">🗂</div>
          <b>رکوردی نمایش داده نشده</b>
          <p className="text-sm text-slate-400">جستجو/فیلتر کنید یا باز کنید.</p>
          <button className="btn-p mt-3" onClick={() => setOn(true)}>📋 نمایش {fa(total || '…')} رکورد</button>
        </div>
      ) : total === 0 ? (
        <div className="card text-center border-dashed py-10">
          <b>نتیجه‌ای یافت نشد</b>
          <button className="btn-g btn-sm mt-3" onClick={() => { setQ(''); setF({}); setH({ g: '', p: '', j: '', s: '' }); }}>🔁 پاک‌سازی</button>
        </div>
      ) : (
        <>
          <div className="tblwrap">
            <table>
              <thead><tr>{cols.map((c, i) => <th key={i}>{c.h}</th>)}</tr></thead>
              <tbody>
                {data.map((r, i) => (
                  <tr key={r.id || i}>{cols.map((c, j) => <td key={j}>{c.c(r)}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-2 items-center mt-3 text-sm">
            <span className="text-slate-400">نمایش {fa(start + 1)} تا {fa(Math.min(start + ps, total))} از {fa(total)}</span>
            <select className="inp !w-[80px] !py-1 text-xs" value={String(ps)} onChange={(e) => setPs(e.target.value === 'all' ? 0 : +e.target.value)}>
              {[10, 20, 50].map((n) => <option key={n} value={n}>{fa(n)}</option>)}
              <option value="all">همه</option>
            </select>
            <div className="flex gap-1 mr-auto flex-wrap">
              {page > 1 && <button className="btn-g !p-1.5 !px-2.5 text-xs" onClick={() => setPage(page - 1)}>→</button>}
              {Array.from({ length: Math.min(7, pages) }, (_, i) => {
                const p = pages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= pages - 3 ? pages - 6 + i : page - 3 + i;
                return <button key={p} className={`btn ${p === page ? 'btn-p' : 'btn-g'} !p-1.5 !px-2.5 text-xs`} onClick={() => setPage(p)}>{fa(p)}</button>;
              })}
              {page < pages && <button className="btn-g !p-1.5 !px-2.5 text-xs" onClick={() => setPage(page + 1)}>←</button>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
