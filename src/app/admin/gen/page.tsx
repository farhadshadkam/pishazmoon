'use client';
import AdminShell from '@/components/AdminShell';
import { post, fa } from '@/lib/client';
import { useState } from 'react';

export default function AdminGen() {
  const [tab, setTab] = useState<'full' | 'help'>('full');
  const [jsonData, setJsonData] = useState<any>(null);
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(''); setResult(null); setJsonData(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.standard) {
        throw new Error('ساختار JSON نامعتبر — فایل باید با { "standard": { ... } } شروع شود. ابتدای فایل شما: ' + text.trim().slice(0, 80));
      }
      setJsonData(data);
      setFileName(file.name);
    } catch (err: any) {
      setError(err.message || 'فایل JSON قابل خواندن نیست');
    }
  };

  const doImport = async () => {
    if (!jsonData) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await post('/admin/import-full', jsonData, true);
      setResult(r);
    } catch (err: any) {
      setError(err.message || 'خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const std = jsonData?.standard;
  const totalQ = std?.chapters?.reduce((a: number, c: any) => a + (c.questions?.length || 0), 0) || 0;
  const totalWeight = std?.chapters?.reduce((a: number, c: any) => a + (c.weight || 0), 0) || 0;
  const chapterCount = std?.chapters?.length || 0;

  return (
    <AdminShell title="🤖 تولید هوشمند سوالات">
      <div dir="rtl">
        {/* تب‌ها */}
        <div className="flex gap-2 mb-4">
          <button className={`btn ${tab === 'full' ? 'btn-p' : 'btn-g'} btn-sm`} onClick={() => setTab('full')}>
            📦 ایمپورت کامل (استاندارد + سوالات)
          </button>
          <button className={`btn ${tab === 'help' ? 'btn-p' : 'btn-g'} btn-sm`} onClick={() => setTab('help')}>
            📖 راهنمای پرامپت
          </button>
        </div>

        {tab === 'full' ? (
          <div>
            {/* راهنمای کوتاه */}
            <div className="card mb-4">
              <h3 className="font-bold mb-1">ایمورت فایل JSON کامل</h3>
              <p className="text-sm text-slate-400">
                فایل خروجی پرامپت (شامل استاندارد + فصل‌ها + سوالات) را انتخاب کنید.
                ساختار باید <code className="bg-slate-100 px-1.5 rounded text-xs">{'{ "standard": { ... } }'}</code> باشد.
              </p>
            </div>

            {/* باکس انتخاب فایل */}
            <label className="block border-2 border-dashed border-[#E4E7F2] rounded-xl p-10 text-center cursor-pointer hover:border-[#2E4BD1] hover:bg-[#FAFBFF] transition bg-white">
              <input type="file" accept=".json,.txt" onChange={handleFile} className="hidden" />
              {jsonData ? (
                <div>
                  <div className="text-4xl">✅</div>
                  <b className="text-emerald-600 text-lg">{fileName}</b>
                  <div className="mt-2 flex flex-wrap gap-2 justify-center">
                    <span className="b-info">{std?.title}</span>
                    <span className="b-gray">{fa(chapterCount)} فصل</span>
                    <span className="b-gray">{fa(totalQ)} سوال</span>
                    <span className={totalWeight === 40 ? 'b-ok' : 'b-bad'}>وزن کل: {fa(totalWeight)}/۴۰</span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-4xl">📎</div>
                  <b className="block mt-2 text-slate-600">کلیک کنید یا فایل JSON را انتخاب کنید</b>
                  <p className="text-sm text-slate-400 mt-1">فقط فایل .json یا .txt</p>
                </div>
              )}
            </label>

            {/* خطای پارس فایل */}
            {error && (
              <div className="mt-4 bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-600">
                <b>❌ خطا در خواندن فایل:</b>
                <p className="mt-1">{error}</p>
              </div>
            )}

            {/* پیش‌نمایش فصل‌ها */}
            {jsonData && (
              <div className="mt-4">
                <h4 className="font-bold text-sm mb-2">پیش‌نمایش فصل‌ها و سوالات:</h4>
                <div className="tblwrap">
                  <table>
                    <thead>
                      <tr><th>#</th><th>فصل</th><th>وزن</th><th>تعداد سوال</th><th>حداقل لازم</th><th>وضعیت</th></tr>
                    </thead>
                    <tbody>
                      {std.chapters.map((ch: any, i: number) => {
                        const qCount = ch.questions?.length || 0;
                        const minRequired = (ch.weight || 0) * 10;
                        const ok = qCount >= minRequired;
                        return (
                          <tr key={i}>
                            <td>{fa(i + 1)}</td>
                            <td className="whitespace-normal max-w-[300px]">{ch.title}</td>
                            <td><span className="b-info">{fa(ch.weight)}</span></td>
                            <td><b>{fa(qCount)}</b></td>
                            <td className="text-slate-400">{fa(minRequired)}</td>
                            <td>
                              {ok
                                ? <span className="b-ok">کافی</span>
                                : <span className="b-warn">کمتر از حد</span>}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="font-bold bg-slate-50">
                        <td colSpan={2}>جمع کل</td>
                        <td><span className={totalWeight === 40 ? 'b-ok' : 'b-bad'}>{fa(totalWeight)}/۴۰</span></td>
                        <td>{fa(totalQ)}</td>
                        <td className="text-slate-400">۴۰۰+</td>
                        <td>
                          {totalQ >= 400
                            ? <span className="b-ok">✅ کافی</span>
                            : <span className="b-warn">{fa(400 - totalQ)} کم</span>}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {totalWeight !== 40 && (
                  <p className="text-rose-500 text-sm mt-2 font-bold">
                    ⚠️ جمع وزن فصل‌ها {fa(totalWeight)} است — باید دقیقاً ۴۰ باشد!
                  </p>
                )}
              </div>
            )}

            {/* دکمه ایمپورت */}
            {jsonData && (
              <button
                className="btn-p w-full mt-4 !py-4 text-base font-bold"
                onClick={doImport}
                disabled={loading || totalWeight !== 40}
              >
                {loading
                  ? '⏳ در حال ایمپورت... لطفاً صبر کنید'
                  : `📤 ایمپورت ${fa(totalQ)} سوال به بانک سوالات`}
              </button>
            )}

            {/* نتیجه موفق */}
            {result && result.ok && (
              <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                <b className="text-emerald-700 text-lg">✅ ایمپورت موفق!</b>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                  <div className="stat text-center">
                    <b className="text-emerald-600">{fa(result.questionsAdded)}</b>
                    <span className="text-xs text-slate-400">سوال واردشده</span>
                  </div>
                  <div className="stat text-center">
                    <b className="text-rose-600">{fa(result.questionsRejected)}</b>
                    <span className="text-xs text-slate-400">ردشده</span>
                  </div>
                  <div className="stat text-center">
                    <b className="text-blue-600">{fa(result.chaptersAdded)}</b>
                    <span className="text-xs text-slate-400">فصل جدید</span>
                  </div>
                  <div className="stat text-center">
                    <b>{fa(result.questionsAdded + result.questionsRejected)}</b>
                    <span className="text-xs text-slate-400">کل پردازش‌شده</span>
                  </div>
                </div>
                {result.questionsRejected > 0 && (
                  <p className="text-sm text-amber-600 mt-2">
                    ⚠️ {fa(result.questionsRejected)} سوال به‌دلیل گزینه ممنوع یا تکراری رد شد.
                  </p>
                )}
                {result.warnings && result.warnings.length > 0 && (
                  <details className="mt-3">
                    <summary className="text-sm text-slate-500 cursor-pointer">
                      {fa(result.warnings.length)} هشدار (کلیک کنید)
                    </summary>
                    <ul className="text-xs text-slate-400 mt-2 space-y-1">
                      {result.warnings.slice(0, 10).map((w: string, i: number) => (
                        <li key={i} className="bg-slate-50 rounded px-2 py-1">• {w}</li>
                      ))}
                    </ul>
                  </details>
                )}
                <div className="flex gap-2 mt-4 flex-wrap">
                  <a href="/admin/bank" className="btn-t btn-sm">🏦 رفتن به بانک سوالات برای بازبینی</a>
                  <button className="btn-g btn-sm" onClick={() => { setJsonData(null); setResult(null); setFileName(''); }}>
                    📎 ایمپورت فایل دیگر
                  </button>
                </div>
              </div>
            )}

            {/* نتیجه خطا */}
            {result && !result.ok && (
              <div className="mt-4 bg-rose-50 border border-rose-200 rounded-xl p-5">
                <b className="text-rose-600 text-lg">❌ {result.message || result.error}</b>

                {result.hint && (
                  <div className="mt-3 bg-rose-100 rounded-lg p-3">
                    <b className="text-xs">ابتدای فایل شما:</b>
                    <p className="text-xs font-mono text-rose-500 mt-1 break-all">{result.hint}</p>
                  </div>
                )}

                {result.errors && result.errors.length > 0 && (
                  <div className="mt-3">
                    <b className="text-sm">جزئیات خطاها ({fa(result.totalErrors || result.errors.length)} مورد):</b>
                    <ul className="text-xs mt-2 space-y-1 max-h-[300px] overflow-auto">
                      {result.errors.map((e: string, i: number) => (
                        <li key={i} className="bg-rose-100 rounded-lg px-3 py-2">
                          <span className="font-bold text-rose-700">خطا {fa(i + 1)}:</span> {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.error === 'WEIGHT_MISMATCH' && (
                  <p className="text-sm text-rose-500 mt-2">
                    💡 راه‌حل: در پرامپت، دستور بدهید که جمع وزن فصل‌ها باید دقیقاً ۴۰ باشد.
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ═══════════ تب راهنما ═══════════ */
          <div className="card">
            <h3 className="font-bold mb-4">📖 راهنمای تولید سوالات با پرامپت</h3>

            <div className="space-y-3">
              <div className="bg-[#E7ECFF] rounded-xl p-4">
                <b className="text-[#1D2E7A]">قدم ۱: آماده‌سازی</b>
                <p className="text-sm text-slate-500 mt-1">
                  متن کامل استاندارد آموزشی (PDF/Word) را تهیه کنید و متن آن را استخراج نمایید.
                </p>
              </div>

              <div className="bg-[#E7ECFF] rounded-xl p-4">
                <b className="text-[#1D2E7A]">قدم ۲: اجرای پرامپت</b>
                <p className="text-sm text-slate-500 mt-1">
                  پرامپت Master v3.1 را در ChatGPT یا Claude کپی کنید و متن استاندارد را در انتهای آن جایگذاری نمایید.
                  ابتدا جدول فصل‌ها و وزن‌ها را نشان می‌دهد — پس از بررسی، بگویید «تأیید — شروع کن».
                </p>
              </div>

              <div className="bg-[#E7ECFF] rounded-xl p-4">
                <b className="text-[#1D2E7A]">قدم ۳: تولید فصل به فصل</b>
                <p className="text-sm text-slate-500 mt-1">
                  پس از هر فصل، بگویید «فصل بعدی». در پایان، بگویید «مونتاژ نهایی» تا کل JSON واحد تولید شود.
                </p>
              </div>

              <div className="bg-[#E7ECFF] rounded-xl p-4">
                <b className="text-[#1D2E7A]">قدم ۴: ذخیره فایل</b>
                <p className="text-sm text-slate-500 mt-1">
                  کل JSON خروجی را در فایلی با نام <code className="bg-slate-100 px-1.5 rounded text-xs">bank.json</code> ذخیره کنید.
                </p>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <b className="text-emerald-700">قدم ۵: ایمپورت در همین صفحه</b>
                <p className="text-sm text-slate-500 mt-1">
                  به تب «ایمپورت کامل» برگردید، فایل را انتخاب و دکمه ایمپورت را بزنید. ✅
                </p>
              </div>
            </div>

            {/* چک‌لیست فرمت */}
            <div className="mt-6">
              <h4 className="font-bold text-sm mb-2">✅ چک‌لیست فرمت JSON (قبل از ایمپورت چک کنید):</h4>
              <div className="tblwrap">
                <table>
                  <thead>
                    <tr><th>#</th><th>الزامی</th><th>توضیح</th></tr>
                  </thead>
                  <tbody>
                    {[
                      ['۱', 'فایل با {"standard": شروع شود', 'نه {"metadata": یا {"questions":'],
                      ['۲', 'options آرایه باشد', '["الف","ب","ج","د"] — نه {"1":"الف"}'],
                      ['۳', 'difficulty فارسی باشد', '"آسان" | "متوسط" | "دشوار" — نه "easy"'],
                      ['۴', 'cognitive از ۵ مقدار مجاز', '"یادآوری" | "فهم" | "کاربرد" | "تحلیل" | "ارزیابی"'],
                      ['۵', 'correct عدد ۱ تا ۴', '۱ = اولین گزینه، ۴ = چهارمین گزینه'],
                      ['۶', 'جمع وزن فصل‌ها = ۴۰', 'weight هر فصل + بقیه = دقیقاً ۴۰'],
                      ['۷', 'hours عدد باشد', 'نه رشته — "72" غلط، 72 درست'],
                      ['۸', 'source تمیز باشد', 'بدون کد سیستمی مثل filecite'],
                    ].map(([n, req, desc]) => (
                      <tr key={n}>
                        <td>{n}</td>
                        <td className="font-bold">{req}</td>
                        <td className="text-slate-400 whitespace-normal">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
