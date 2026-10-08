'use client';
import { setToken } from '@/lib/client';
import { useState } from 'react';

export default function AdminLogin() {
  const [e, setE] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const doLogin = async () => {
    setErr(''); setLoading(true);
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: e, password: p }),
    });
    const d = await res.json();
    setLoading(false);

    if (d.token) {
      setToken(d.token, true);
      // ریدایرکت بر اساس نقش
      if (d.role === 'evaluator') {
        location.href = '/evaluator';
      } else {
        location.href = '/admin';
      }
    } else {
      setErr(d.error === 'ACCOUNT_SUSPENDED' ? 'حساب شما غیرفعال شده است' : '❌ ایمیل یا رمز عبور نادرست است');
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-16" dir="rtl">
      <div className="card">
        <h2 className="text-center font-bold">ورود به سامانه</h2>
        <p className="text-xs text-center text-slate-400 mt-1">پنل مدیریت و ارزیابی</p>

        <label className="text-sm font-bold block mt-4">ایمیل</label>
        <input className="inp" dir="ltr" value={e} onChange={(ev) => setE(ev.target.value)} />

        <label className="text-sm font-bold block mt-3">رمز عبور</label>
        <input className="inp" type="password" dir="ltr" value={p}
          onChange={(ev) => setP(ev.target.value)}
          onKeyDown={(ev) => { if (ev.key === 'Enter') doLogin(); }} />

        <p className="text-rose-500 text-xs min-h-5 mt-2">{err}</p>

        <button className="btn-p w-full !py-3" onClick={doLogin} disabled={loading}>
          {loading ? '⏳ در حال ورود...' : 'ورود'}
        </button>
      </div>
    </div>
  );
}
