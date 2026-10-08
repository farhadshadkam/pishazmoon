'use client';
import AdminShell from '@/components/AdminShell';
import { get, post, fa } from '@/lib/client';
import { useEffect, useState } from 'react';

export default function DiscountsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ code: '', percentage: 50, maxUses: '', note: '' });
  const [msg, setMsg] = useState('');

  const load = async () => setItems(await get('/admin/discounts', true));
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.code) return setMsg('کد را وارد کنید');
    const r = await post('/admin/discounts', {
      code: form.code, percentage: +form.percentage,
      maxUses: form.maxUses ? +form.maxUses : null, note: form.note,
    }, true);
    if (r.ok) { setForm({ code: '', percentage: 50, maxUses: '', note: '' }); setMsg('✅ کد ایجاد شد'); load(); }
    else setMsg(r.error === 'DUPLICATE' ? 'این کد قبلاً ثبت شده' : 'خطا');
  };

  const toggle = async (id: string, active: boolean) => {
    await fetch('/api/admin/discounts', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('PA_AD')}` },
      body: JSON.stringify({ id, active: !active }),
    }); load();
  };

  const del = async (id: string) => {
    if (!confirm('حذف این کد؟')) return;
    await fetch('/api/admin/discounts', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('PA_AD')}` },
      body: JSON.stringify({ id }),
    }); load();
  };

  return (
    <AdminShell title="🎟 کدهای تخفیف">
      <div dir="rtl">
        {/* فرم ایجاد */}
        <div className="card mb-4">
          <h3 className="font-bold mb-3">ایجاد کد تخفیف جدید</h3>
          <div className="grid md:grid-cols-4 gap-3">
            <div><label className="text-xs font-bold">کد</label><input className="inp" dir="ltr" placeholder="WELCOME1404" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} /></div>
            <div><label className="text-xs font-bold">درصد تخفیف (۱-۱۰۰)</label><input className="inp" type="number" min="1" max="100" value={form.percentage} onChange={e => setForm({ ...form, percentage: +e.target.value })} /></div>
            <div><label className="text-xs font-bold">حداکثر استفاده (خالی=نامحدود)</label><input className="inp" type="number" placeholder="100" value={form.maxUses} onChange={e => setForm({ ...form, maxUses: e.target.value })} /></div>
            <div><label className="text-xs font-bold">توضیح</label><input className="inp" placeholder="کمپین افتتاحیه" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></div>
          </div>
          <button className="btn-p mt-3" onClick={create}>➕ ایجاد کد</button>
          {msg && <p className="text-sm mt-2">{msg}</p>}
        </div>

        {/* لیست کدها */}
        <div className="tblwrap">
          <table>
            <thead><tr><th>کد</th><th>درصد</th><th>استفاده</th><th>سفارش‌ها</th><th>توضیح</th><th>وضعیت</th><th>عملیات</th></tr></thead>
            <tbody>
              {items.map((d: any) => (
                <tr key={d.id}>
                  <td dir="ltr"><b>{d.code}</b></td>
                  <td><span className={d.percentage === 100 ? 'b-ok' : 'b-info'}>{fa(d.percentage)}٪</span></td>
                  <td>{fa(d.usedCount)}{d.maxUses ? ` / ${fa(d.maxUses)}` : ' / ∞'}</td>
                  <td>{fa(d._count?.orders || 0)}</td>
                  <td className="text-xs">{d.note || '—'}</td>
                  <td>{d.active ? <span className="b-ok">فعال</span> : <span className="b-bad">غیرفعال</span>}</td>
                  <td>
                    <button className={`btn-sm ${d.active ? 'btn-d' : 'btn-t'}`} onClick={() => toggle(d.id, d.active)}>{d.active ? 'غیرفعال' : 'فعال'}</button>
                    <button className="btn-d btn-sm mr-1" onClick={() => del(d.id)}>🗑</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={7} className="text-center text-slate-400">هنوز کدی ثبت نشده</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
