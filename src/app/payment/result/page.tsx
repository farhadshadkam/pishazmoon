'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
function Res(){const sp=useSearchParams();
  return sp.get('status')==='ok'?(
  <div className="max-w-md mx-auto mt-10 text-center" dir="rtl"><div className="card p-8"><div className="text-5xl">🎉</div>
  <h2>پیش‌آزمون شما فعال شد</h2><p className="text-sm text-slate-400">کد آزمون (اعتبار ۳۰ روز) پیامک شد.</p>
  <div className="bg-[#E7ECFF] rounded-xl p-4 my-3 text-xl font-mono font-extrabold text-[#141E4D]" dir="ltr">{sp.get('code')}</div>
  <div className="flex gap-2 justify-center flex-wrap"><a href="/exam-entry" className="btn-p">ورود به آزمون</a><a href="/dash" className="btn-g">داشبورد من</a></div></div></div>)
  :(<div className="max-w-md mx-auto mt-10 text-center" dir="rtl"><div className="card p-8"><div className="text-5xl">❌</div><h2>پرداخت ناموفق بود</h2><p className="text-sm text-slate-400">مبلغی کسر نشده است؛ دوباره تلاش کنید.</p><a href="/standards" className="btn-g mt-3">بازگشت</a></div></div>)}
export default function Page(){return <Suspense><Res/></Suspense>}
