'use client';
import AdminShell from '@/components/AdminShell';
import { get, fa, money } from '@/lib/client';
import { useEffect, useState } from 'react';

export default function AdminStandards() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/standards/list?q=${encodeURIComponent(q)}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('PA_AD')}` },
    }).then(r => r.json()).then(d => {
      setItems(d.items || []);
      setTotal(d.total || 0);
      setLoading(false);
    });
  }, [q]);

  return (
    <AdminShell title="استانداردها">
      <div dir="rtl">
        <input className="inp max-w-[300px] mb-4" placeholder="🔍 جستجو..." value={q} onChange={(e) => { setQ(e.target.value); setLoading(true); }} />
        <p className="text-sm text-slate-400 mb-3">{fa(total)} استاندارد</p>
        {loading ? <p className="py-8 text-center text-slate-400">...</p> : (
          <div className="tblwrap">
            <table>
              <thead><tr><th>کد</th><th>عنوان</th><th>گروه</th><th>قیمت</th><th>وضعیت</th></tr></thead>
              <tbody>
                {items.map((s: any) => (
                  <tr key={s.id}>
                    <td dir="ltr">{s.code}</td>
                    <td><b>{s.title}</b></td>
                    <td>{s.groupName}</td>
                    <td>{money(s.price)}</td>
                    <td>{s.published ? <span className="b-ok">فعال</span> : <span className="b-bad">غیرفعال</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
