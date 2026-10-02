// payment.ts
const BASE = () => (process.env.ZARINPAL_SANDBOX === 'true'
  ? 'https://sandbox.zarinpal.com/pg/v4/payment' : 'https://payment.zarinpal.com/pg/v4/payment');

export async function paymentRequest(amount: number, callbackUrl: string, description: string) {
  const r = await fetch(`${BASE()}/request.json`, { method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ merchant_id: process.env.ZARINPAL_MERCHANT_ID, amount, callback_url: callbackUrl, description }) });
  const d = await r.json();
  const a = d?.data?.authority;
  return { authority: a ?? null, redirect: a ? `${BASE().includes('sandbox') ? 'https://sandbox.zarinpal.com/pg/StartPay/' : 'https://www.zarinpal.com/pg/StartPay/'}${a}` : null };
}
export async function paymentVerify(amount: number, authority: string) {
  const r = await fetch(`${BASE()}/verify.json`, { method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ merchant_id: process.env.ZARINPAL_MERCHANT_ID, amount, authority }) });
  const d = await r.json();
  return { ok: d?.data?.code === 100 || d?.data?.code === 101, refId: d?.data?.ref_id ?? null };
}
