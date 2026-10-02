'use client';

let token = '';
let adminToken = '';

export function setToken(t: string, admin = false) {
  if (admin) { adminToken = t; localStorage.setItem('PA_AD', t); }
  else { token = t; localStorage.setItem('PA_TK', t); }
}

export function getToken(admin = false) {
  if (admin) return adminToken || (typeof window !== 'undefined' ? localStorage.getItem('PA_AD') || '' : '');
  return token || (typeof window !== 'undefined' ? localStorage.getItem('PA_TK') || '' : '');
}

export async function api<T = any>(path: string, opts: RequestInit = {}, admin = false): Promise<T> {
  const r = await fetch(`/api${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken(admin) && { Authorization: `Bearer ${getToken(admin)}` }),
      ...opts.headers,
    },
  });
  if (r.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem(admin ? 'PA_AD' : 'PA_TK');
    location.href = admin ? '/admin/login' : '/auth';
  }
  return r.json();
}

export const post = <T = any>(p: string, body: any, admin = false) => api<T>(p, { method: 'POST', body: JSON.stringify(body) }, admin);
export const get = <T = any>(p: string, admin = false) => api<T>(p, {}, admin);
export const fa = (x: any) => String(x).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]);
export const money = (n: number) => fa(n.toLocaleString('en-US'));
