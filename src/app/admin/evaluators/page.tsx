'use client';
import AdminShell from '@/components/AdminShell';
import { get, post, fa } from '@/lib/client';
import { useEffect, useState } from 'react';

const GROUPS = [
  'صنایع خودرو', 'الکترونیک', 'صنایع چوب', 'صنایع کاغذ',
  'جوشکاری و بازرسی جوش', 'حمل و نقل زمینی', 'حمل و نقل دریایی', 'حمل و نقل ریلی',
  'تاسیسات', 'صنایع دریایی', 'صنایع رنگ', 'صنایع شیمیایی',
  'پلیمر', 'پتروشیمی', 'صنایع چرم و پوست و خز', 'صنایع نساجی',
  'متالورژی', 'فناوری ارتباطات', 'مدیریت صنایع', 'سرامیک',
  'مکانیک', 'کنترل و ابزار دقیق', 'برق', 'صنایع فلزی',
  'ساختمان', 'معماری', 'صنعت چاپ', 'معدن',
  'امور اداری', 'امور مالی و بازرگانی', 'بهداشت و ایمنی', 'فناوری اطلاعات',
  'مراقبت و زیبایی', 'خدمات آموزشی', 'صنایع پوشاک', 'گردشگری',
  'هتلداری', 'امور شیلات و آبزی پروری', 'امور دام و ماکیان', 'امور باغی',
  'امور زراعی', 'زیست فناوری', 'فناوری محیط زیست', 'ماشین آلات کشاورزی',
  'صنایع غذایی', 'خدمات تغذیه ای', 'فرش', 'هنرهای تجسمی',
  'هنرهای تزئینی', 'هنرهای نمایشی', 'فناوری نرم و فرهنگی', 'صنعت ورزش',
  'فناوری هوایی', 'فناوری نانو', 'سلامت و طب ایرانی', 'صنعت گاز',
];

export default function EvaluatorsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', groupName: GROUPS[31] });
  const [msg, setMsg] = useState('');

  const load = async () => setItems(await get('/admin/evaluators', true));
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name || !form.email || !form.password) return setMsg('همه فیلدها الزامی است');
    const r = await post('/admin/evaluators', form, true);
    if (r.ok) { setForm({ name: '', email: '', password: '', groupName: GROUPS[31] }); setMsg('✅ ارزیاب ایجاد شد'); load(); }
    else setMsg(r.error === 'EMAIL_EXISTS' ? 'این ایمیل قبلاً ثبت شده' : 'خطا در ایجاد');
  };

  const toggle = async (id: string, active: boolean) => {
    await fetch('/api/admin/evaluators', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('PA_AD')}` },
      body: JSON.stringify({ id, active: !active }),
    }); load();
  };

  return (
    <AdminShell title="👥 مدیریت ارزیابان">
      <div dir="rtl">
        {/* ایجاد ارزیاب جدید */}
        <div className="card mb-4">
          <h3 className="font-bold mb-3">ایجاد ارزیاب جدید</h3>
          <div className="grid md:grid-cols-4 gap-3">
            <div><label className="text-xs font-bold">نام و نام خانوادگی</label><input className="inp" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="text-xs font-bold">ایمیل</label><input className="inp" dir="ltr" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className="text-xs font-bold">رمز عبور</label><input className="inp" type="password" dir="ltr" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
            <div><label className="text-xs font-bold">گروه برنامه‌ریزی درسی</label>
              <select className="inp" value={form.groupName} onChange={e => setForm({ ...form, groupName: e.target.value })}>
                {GROUPS.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <button className="btn-p mt-3" onClick={create}>➕ ایجاد ارزیاب</button>
          {msg && <p className="text-sm mt-2">{msg}</p>}
        </div>

        {/* لیست ارزیابان + عملکرد */}
        <div className="tblwrap">
          <table>
            <thead><tr><th>نام</th><th>ایمیل</th><th>گروه</th><th>کل بازبینی</th><th>تأیید</th><th>رد</th><th>اصلاح</th><th>وضعیت</th><th>عملیات</th></tr></thead>
            <tbody>
              {items.map((ev: any) => (
                <tr key={ev.id}>
                  <td><b>{ev.name}</b></td>
                  <td dir="ltr" className="text-xs">{ev.email}</td>
                  <td><span className="b-info">{ev.groupName}</span></td>
                  <td><b>{fa(ev.totalReviews)}</b></td>
                  <td className="text-emerald-600">{fa(ev.approved)}</td>
                  <td className="text-rose-600">{fa(ev.rejected)}</td>
                  <td className="text-blue-600">{fa(ev.edited)}</td>
                  <td>{ev.active ? <span className="b-ok">فعال</span> : <span className="b-bad">غیرفعال</span>}</td>
                  <td>
                    <button className={`btn-sm ${ev.active ? 'btn-d' : 'btn-t'}`} onClick={() => toggle(ev.id, ev.active)}>
                      {ev.active ? 'تعلیق' : 'فعال‌سازی'}
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={9} className="text-center text-slate-400">هنوز ارزیابی ثبت نشده</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
