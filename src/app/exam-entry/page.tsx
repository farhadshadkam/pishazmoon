'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export default function ExamEntry() {
  const [code, setCode] = useState(''); const [nid, setNid] = useState(''); const [mob, setMob] = useState('');
  const [err, setErr] = useState(''); const router = useRouter();
  const start = async () => {
    sessionStorage.setItem('PA_ENTRY', JSON.stringify({ code, nationalId: nid, mobile: mob }));
    const r = await fetch('/api/exam/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, nationalId: nid, mobile: mob }) }).then((x) => x.json());
    if (r.error) setErr({ CODE_NOT_FOUND: 'کد آزمون یافت نشد', CODE_USED: 'این کد قبلاً استفاده شده', CODE_EXPIRED: 'اعتبار کد به پایان رسیده', OWNER_MISMATCH: 'اطلاعات شناسایی مطابقت ندارد', BANK_INCOMPLETE: 'بانک سوالات در حال تکمیل است' }[r.error] || 'خطا');
    else router.push('/exam');
  };
  return (<div className="max-w-md mx-auto mt-8" dir="rtl"><div className="card">
    <h2 className="text-center font-bold">ورود به جلسه آزمون</h2>
    <p className="text-sm text-slate-400 text-center">هر سه فیلد باید با مالک کد مطابقت داشته باشد.</p>
    <label className="text-sm font-bold block mt-4">کد آزمون</label>
    <input className="inp" dir="ltr" style={{ fontFamily: 'monospace' }} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="PA-XXXX-XXXX" />
    <div className="grid grid-cols-2 gap-3 mt-3">
      <div><label className="text-sm font-bold">کد ملی</label><input className="inp" dir="ltr" maxLength={10} value={nid} onChange={(e) => setNid(e.target.value)} /></div>
      <div><label className="text-sm font-bold">موبایل</label><input className="inp" dir="ltr" maxLength={11} value={mob} onChange={(e) => setMob(e.target.value)} /></div>
    </div>
    <p className="text-rose-500 text-xs min-h-4">{err}</p>
    <button className="btn-p w-full !py-3" onClick={start}>احراز و شروع آزمون</button>
    <div className="mt-3 bg-[#F7F8FD] rounded-xl p-3 text-xs text-slate-500"><b>قوانین جلسه:</b>• ۴۰ سؤال مطابق وزن فصل‌ها • ۶۰ دقیقه • بدون نمره منفی • پاسخ‌ها خودکار ذخیره می‌شود • پایان زمان = ارسال خودکار</div>
  </div></div>);
}
