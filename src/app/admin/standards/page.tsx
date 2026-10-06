'use client';
import AdminShell from '@/components/AdminShell';
import { get, fa, money } from '@/lib/client';
import { useEffect, useState, useCallback, useMemo } from 'react';

export default function AdminStandards() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showList, setShowList] = useState(false);
  const [q, setQ] = useState('');
  const [g, setG] = useState('');
  const [groups, setGroups] = useState<string[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleteStep, setDeleteStep] = useState(0);

  const load = useCallback(async () => {
    if (!showList) { setLoading(false); return; }
    setLoading(true);
    const sp = new URLSearchParams({ ...(q && { q }), ...(g && { g }) });
    const d = await get(`/admin/standards/list?${sp}`, true);
    setItems(d.items || []);
    setTotal(d.total || 0);
    if (d.hierOpts?.gs) setGroups(d.hierOpts.gs);
    setLoading(false);
  }, [q, g, showList]);

  useEffect(() => { load(); }, [load]);

  const api = (method: string, id: string, body?: any) =>
    fetch(`/api/admin/standards/${id}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('PA_AD')}` },
      body: body ? JSON.stringify(body) : undefined,
    }).then(r => r.json());

  const startEdit = (s: any) => {
    setEditing(s.id);
    setEditForm({ title: s.title, groupName: s.groupName, profession: s.profession, job: s.job, code: s.code, hours: s.hours, price: s.price });
  };

  const saveEdit = async () => {
    const r = await api('PUT', editing, editForm);
    if (r.ok) { setEditing(null); load(); } else alert('خطا در ذخیره');
  };

  const doDelete = async () => {
    if (deleteStep < 2) return;
    const r = await api('DELETE', deleteTarget.id);
    if (r.ok) {
      alert(`✅ حذف کامل شد!\n${fa(r.deletedQuestions)} سوال و ${fa(r.deletedChapters)} فصل حذف گردید.`);
      setDeleteTarget(null); setDeleteStep(0);
      load();
    } else {
      alert('خطا در حذف: ' + (r.message || r.error));
      setDeleteTarget(null); setDeleteStep(0);
    }
  };

  return (
    <AdminShell title="📚 مدیریت استانداردها">
      <div dir="rtl">
        {/* فیلتر */}
        <div className="card p-3 mb-4">
          <div className="flex flex-wrap gap-2 items-center">
            <input className="inp max-w-[220px]" placeholder="🔍 جستجوی عنوان یا کد..." value={q}
              onChange={(e) => { setQ(e.target.value); setShowList(true); }} />
            <select className="inp max-w-[200px]" value={g} onChange={(e) => { setG(e.target.value); setShowList(true); }}>
              <option value="">همه گروه‌ها</option>
              {groups.map((x: string) => <option key={x}>{x}</option>)}
            </select>
            <button className="btn-p btn-sm" onClick={() => setShowList(true)}>📋 نمایش ({fa(total)})</button>
            <button className="btn-g btn-sm" onClick={() => { setQ(''); setG(''); setShowList(false); }}>🔁 پاک‌سازی</button>
          </div>
        </div>

        {!showList ? (
          <div className="card text-center border-dashed py-12">
            <div className="text-4xl">🗂</div>
            <b>برای مشاهده استانداردها، جستجو کنید یا دکمه نمایش را بزنید</b>
            <p className="text-sm text-slate-400 mt-1">({fa(total)} استاندارد ثبت شده)</p>
          </div>
        ) : loading ? (
          <p className="text-center py-10 text-slate-400">در حال بارگذاری...</p>
        ) : items.length === 0 ? (
          <div className="card text-center border-dashed py-12"><b>یافت نشد</b></div>
        ) : (
          <div className="space-y-3">
            {items.map((s: any) => (
              <div key={s.id} className={`card p-4 ${!s.published ? 'opacity-60' : ''}`}>
                {editing === s.id ? (
                  <div className="space-y-2">
                    <div className="grid md:grid-cols-2 gap-3">
                      <div><label className="text-xs font-bold">عنوان</label><input className="inp !py-1.5" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} /></div>
                      <div><label className="text-xs font-bold">کد</label><input className="inp !py-1.5" dir="ltr" value={editForm.code} onChange={(e) => setEditForm({ ...editForm, code: e.target.value })} /></div>
                      <div><label className="text-xs font-bold">گروه برنامه‌ریزی</label><input className="inp !py-1.5" value={editForm.groupName} onChange={(e) => setEditForm({ ...editForm, groupName: e.target.value })} /></div>
                      <div><label className="text-xs font-bold">حرفه</label><input className="inp !py-1.5" value={editForm.profession} onChange={(e) => setEditForm({ ...editForm, profession: e.target.value })} /></div>
                      <div><label className="text-xs font-bold">شغل</label><input className="inp !py-1.5" value={editForm.job} onChange={(e) => setEditForm({ ...editForm, job: e.target.value })} /></div>
                      <div><label className="text-xs font-bold">قیمت (تومان)</label><input className="inp !py-1.5" type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: +e.target.value })} /></div>
                      <div><label className="text-xs font-bold">ساعت</label><input className="inp !py-1.5" type="number" value={editForm.hours} onChange={(e) => setEditForm({ ...editForm, hours: +e.target.value })} /></div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button className="btn-t btn-sm" onClick={saveEdit}>💾 ذخیره</button>
                      <button className="btn-g btn-sm" onClick={() => setEditing(null)}>انصراف</button>
                    </div>
                  </div>
                ) : deleteTarget?.id === s.id ? (
                  <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-4">
                    {deleteStep === 1 && (
                      <>
                        <b className="text-rose-700 text-lg">⚠️ هشدار حذف کامل!</b>
                        <p className="text-sm mt-2 text-rose-600">
                          با حذف استاندارد «{s.title}»، <b>تمام بانک سوالات این استاندارد</b> (فصل‌ها و سوالات) نیز به‌طور کامل حذف خواهد شد.
                          این عمل <b>قابل بازگشت نیست!</b>
                        </p>
                        <div className="flex gap-2 mt-4">
                          <button className="btn-d !py-2.5 flex-1" onClick={() => setDeleteStep(2)}>🗑 بله، حذف کامل کن</button>
                          <button className="btn-g !py-2.5 flex-1" onClick={() => { setDeleteTarget(null); setDeleteStep(0); }}>انصراف</button>
                        </div>
                      </>
                    )}
                    {deleteStep === 2 && (
                      <>
                        <b className="text-rose-700 text-lg">🔴 تأیید نهایی</b>
                        <p className="text-sm mt-2">آیا ۱۰۰٪ مطمئن هستید؟ این عمل غیرقابل بازگشت است!</p>
                        <div className="flex gap-2 mt-4">
                          <button className="btn-d !py-2.5 flex-1 font-bold" onClick={doDelete}>🗑 تأیید نهایی حذف</button>
                          <button className="btn-g !py-2.5 flex-1" onClick={() => { setDeleteTarget(null); setDeleteStep(0); }}>انصراف</button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex justify-between items-start gap-3 flex-wrap">
                    <div className="flex-1 min-w-[250px]">
                      <div className="flex gap-2 flex-wrap mb-1">
                        <code className="text-xs bg-slate-100 px-1.5 rounded">{s.code}</code>
                        {s.published ? <span className="b-ok">فعال</span> : <span className="b-bad">غیرفعال</span>}
                      </div>
                      <b className="text-sm">{s.title}</b>
                      <p className="text-xs text-slate-400">{s.groupName} › {s.profession} › {s.job}</p>
                      <p className="text-xs mt-1">💰 {money(s.price)} تومان | 🕐 {fa(s.hours)} ساعت</p>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      <button className="btn-g btn-sm" onClick={() => startEdit(s)}>✏️ ویرایش</button>
                      <button
                        className="btn-d btn-sm"
                        onClick={() => { setDeleteTarget(s); setDeleteStep(1); }}
                      >🗑 حذف کامل</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
