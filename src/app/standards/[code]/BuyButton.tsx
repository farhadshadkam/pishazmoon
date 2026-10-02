'use client';
import { post, getToken } from '@/lib/client';
export default function BuyButton({ standardId, bankReady }: { standardId: string; bankReady: boolean }) {
  const buy = async () => {
    if (!getToken()) { sessionStorage.setItem('PA_PEND_STD', standardId); location.href = '/auth'; return; }
    const r = await post<{ redirect?: string; error?: string }>('/payment/request', { standardId });
    if (r.redirect) location.href = r.redirect; else alert(r.error || 'خطا');
  };
  return bankReady
    ? <button className="btn-p w-full mt-3 !py-3" onClick={buy}>خرید و شروع پیش‌آزمون</button>
    : <button className="btn-g w-full mt-3 !py-3" disabled>فعلاً قابل خرید نیست (بانک در حال تکمیل)</button>;
}
