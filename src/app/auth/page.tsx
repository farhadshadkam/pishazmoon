'use client';
import { useState } from 'react';
import { post, setToken } from '@/lib/client';

export default function AuthPage() {
  const [tab, setTab] = useState<'reg' | 'in'>('reg');
  const [otp, setOtp] = useState<string | null>(null);
  const [otpIn, setOtpIn] = useState('');
  const [msg, setMsg] = useState('');
  const [p, setP] = useState({ firstName: '', lastName: '', birthYear: 1375, county: '', nationalId: '', mobile: '' });

  const sendOtp = async () => {
    const m = p.mobile.replace(/[۰-۹]/g, (d: string) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
    if (!/^09\d{9}$/.test(m)) return setMsg('موبایل معتبر نیست');
    setMsg('');
    const r = await post<{ sent?: boolean; devCode?: string; error?: string }>('/auth/otp', { mobile: m });
    if (r.error) return setMsg('خطا در ارسال کد');
    setOtp(m);
    if (r.devCode) setMsg(`کد دمو: ${r.devCode}`);
  };

  const verify = async () => {
    const body = { mobile: otp, code: otpIn, ...(tab === 'reg' && { profile: p }) };
    const r = await post<{ token?: string; error?: string }>('/auth/verify', body);
    if (r.token) { setToken(r.token); location.href = '/dash'; }
    else setMsg(r.error === 'OTP_INVALID' ? 'کد نامعتبر' : r.error === 'NID_EXISTS' ? 'کد ملی قبلاً ثبت شده' : 'خطا');
  };

  return (
    <div className="max-w-md mx-auto mt-8" dir="rtl">
      <div className="card">
        {otp ? (
          <div className="text-center">
            <h3 className="font-bold">کد تأیید پیامک‌شده</h3>
            <p className="text-sm text-slate-400">کد ۵ رقمی ارسال‌شده به {otp} را وارد کنید</p>
            <input className="inp text-center !text-2xl tracking-[8px]" maxLength={5} inputMode="numeric" value={otpIn} onChange={(e) => setOtpIn(e.target.value)} />
            <button className="btn-p w-full mt-3 !py-3" onClick={verify}>تأیید و ورود</button>
            <button className="btn-g btn-sm mt-2" onClick={() => setOtp(null)}>ویرایش شماره</button>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-4">
              <button className={`btn ${tab === 'reg' ? 'btn-p' : 'btn-g'} flex-1`} onClick={() => setTab('reg')}>ثبت‌نام سریع</button>
              <button className={`btn ${tab === 'in' ? 'btn-p' : 'btn-g'} flex-1`} onClick={() => setTab('in')}>ورود با موبایل</button>
            </div>
            {tab === 'reg' && <>
              <div className="mb-3"><label className="text-sm font-bold">نام</label><input className="inp" value={p.firstName} onChange={(e) => setP({ ...p, firstName: e.target.value })} /></div>
              <div className="mb-3"><label className="text-sm font-bold">نام خانوادگی</label><input className="inp" value={p.lastName} onChange={(e) => setP({ ...p, lastName: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div><label className="text-sm font-bold">سال تولد</label><input type="number" className="inp" value={p.birthYear} onChange={(e) => setP({ ...p, birthYear: +e.target.value })} /></div>
                <div><label className="text-sm font-bold">شهرستان</label><input className="inp" value={p.county} onChange={(e) => setP({ ...p, county: e.target.value })} /></div>
              </div>
              <div className="mb-3"><label className="text-sm font-bold">کد ملی</label><input className="inp" dir="ltr" maxLength={10} value={p.nationalId} onChange={(e) => setP({ ...p, nationalId: e.target.value })} /></div>
            </>}
            <div className="mb-3"><label className="text-sm font-bold">شماره موبایل</label><input className="inp" dir="ltr" maxLength={11} value={p.mobile} onChange={(e) => setP({ ...p, mobile: e.target.value })} /></div>
            <p className="text-rose-500 text-xs min-h-4">{msg}</p>
            <button className="btn-p w-full !py-3" onClick={sendOtp}>دریافت کد تأیید</button>
          </>
        )}
      </div>
    </div>
  );
}
