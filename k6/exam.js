import http from 'k6/http';
import { check } from 'k6';
export const options = { vus: 100, duration: '5m',
  thresholds: { http_req_failed: ['rate<0.001'], http_req_duration: ['p(95)<300'] } };
const BASE = __ENV.BASE || 'http://localhost:3000';
const H = { headers: { 'Content-Type': 'application/json' } };
export default function () {
  check(http.get(`${BASE}/api/standards?page=1&ps=12`), { 'کاتالوگ ۲۰۰': r => r.status === 200 });
  // برای تست کامل جلسه: در دیتابیس ۱۲۰+ کد ACTIVE seed کنید و DEMO_CODE/NID/MOBILE را بدهید
  if (__ENV.DEMO_CODE) {
    const s = http.post(`${BASE}/api/exam/start`, JSON.stringify({
      code: __ENV.DEMO_CODE, nationalId: __ENV.DEMO_NID, mobile: __ENV.DEMO_MOBILE }), H);
    if (s.status === 200) {
      const d = s.json();
      for (const it of d.items) http.post(`${BASE}/api/exam/answer`, JSON.stringify({ attemptToken: d.attemptToken, qid: it.qid, selected: 0 }), H);
      http.post(`${BASE}/api/exam/submit`, JSON.stringify({ attemptToken: d.attemptToken }), H);
    }
  }
}
