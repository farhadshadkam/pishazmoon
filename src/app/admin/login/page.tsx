'use client';
import { post, setToken } from '@/lib/client';
import { useState } from 'react';

export default function AdminLogin() {
  const [e, setE] = useState(''); const [p, setP] = useState(''); const [err, setErr] = useState('');
  const doLogin = async () => {
    const r = await post<{ token?: string; error?: string }>('/admin/login', { email: e, password: p }, true);
    if (r.token) { setToken(r.token, true); location.href = '/admin'; } else setErr('ایمیل یا رمز نادرست');
  };
  return (
    <div className="max-w-sm mx-auto mt-16" dir="rtl"><div className="card">
      <h2 className="text-center font-bold">ورود مدیران</h2>
      <label className="text-sm font-bold block mt-4">ایمیل</label>
      <input className="inp" dir="ltr" value={e} onChange={(ev) => setE(ev.target.value)} />
      <label className="text-sm font-bold block mt-3">رمز عبور</label>
      <input className="inp" type="password" dir="ltr" value={p} onChange={(ev) => setP(ev.target.value)} />
      <p className="text-rose-500 text-xs min-h-4">{err}</p>
      <button className="btn-p w-full !py-3" onClick={doLogin}>ورود به پنل</button>
    </div></div>
  );
}
