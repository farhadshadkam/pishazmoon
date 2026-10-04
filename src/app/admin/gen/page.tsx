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
    setError(''); setResult(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.standard) throw new Error('ساختار JSON نامعتبر — باید { "standard": { ... } } باشد');
      setJsonData(data);
      setFileName(file.name);
    } catch (err: any) {
      setError(err.message || 'فایل JSON نامعتبر است');
      setJsonData(null);
    }
  };

  const doImport = async () => {
    if (!jsonData) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await post('/admin/import-full', jsonData, true);
      setResult(r);
    } catch (err: any) {
      setError(err.message || 'خطا در ایمپورت');
    } finally {
      setLoading(false);
    }
  };

  const std = jsonData?.standard;
  const totalQ = std?.chapters?.reduce((a: number, c: any) => a + (c.questions?.length || 0), 0) || 0;
  const totalWeight = std?.chapters?.reduce((a: number, c: any) => a + (c.weight || 0), 0) || 0;

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
          <div className="card">
            <h3 className="font-bold mb-2">ایمورت فایل JSON کامل</h3>
            <p className="text-sm text-slate-400 mb-4">
              فایل JSON خروجی پرامپت (شامل استاندارد + فصل‌ها + سوالات) را انتخاب کنید.
              ساختار باید شامل <code className="bg-slate-100 px-1 rounded">{'{ "standard": { ... } }'}</code> باشد.
            </p>

            {/* باکس انتخاب فایل */}
            <label className="block border-2 border-dashed border-[#E4E7F2] rounded-xl p-10 text-center cursor-pointer hover:border-[#2E4BD1] hover:bg-[#FAFBFF] transition bg-white">
              <input type="file" accept=".json" onChange={handleFile} className="hidden" />
              {jsonData ? (
                <div>
                  <div className="text-4xl">✅</div>
                  <b className="text-emerald-600">{fileName}</b>
                  <p className="text-sm text-slate-400 mt-1">
                    {std?.title} | {fa(std?.chapters?.length || 0)} فصل | {fa(totalQ)} سوال | وزن کل: {fa(totalWeight)}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-4xl">📎</div>
                  <b className="block mt-2">کلیک کنید یا فایل را اینجا رها کنید</b>
                  <p className="text-sm text-slate-400">فقط فایل .json</p>
                </div>
              )}
            </label>

            {/* خطا */}
            {error && (
              <div className="mt-4 bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-600">
                ❌ {error}
              </div>
            )}

            {/* پیش‌نمایش فصل‌ها */}
            {jsonData && (
              <div className="mt-4">
                <h4 className="font-bold text-sm mb-2">پیش‌نمایش فصل‌ها:</h4>
                <div className="tblwrap">
                  <table>
                    <thead>
                      <tr><th>#</th><th>فصل</th><th>وزن</th><th>تعداد سوال</th></tr>
                    </thead>
                    <tbody>
                      {std.chapters.map((ch: any, i: number) => (
                        <tr key={i}>
                          <td>{fa(i + 1)}</td>
                          <td>{ch.title}</td>
                          <td><span className={ch.weight >= 1 && ch.weight <= 40 ? 'b-info' : 'b-bad'}>{fa(ch.weight)}</span></td>
                          <td>{fa(ch.questions?.length || 0)}</td>
                        </tr>
                      ))}
                      <tr className="font-bold">
                        <td colSpan={2}>جمع کل</td>
                        <td><span className={totalWeight === 40 ? 'b-ok' : 'b-bad'}>{fa(totalWeight)}</span></td>
                        <td>{fa(totalQ)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {totalWeight !== 40 && (
                  <p className="text-rose-500 text-sm mt-2">⚠️ جمع وزن فصل‌ها {fa(totalWeight)} است — باید دقیقاً ۴۰ باشد!</p>
                )}
              </div>
            )}

            {/* دکمه ایمپورت */}
            {jsonData && (
              <button
                className="btn-p w-full mt-4 !py-3 font-bold"
                onClick={doImport}
                disabled={loading || totalWeight !== 40}
              >
                {loading ? '⏳ در حال ایمپورت...' : `📤 ایمپورت ${fa(totalQ)} سوال به بانک`}
              </button>
            )}

            {/* نتیجه */}
            {result && (
              <div className={`mt-4 rounded-xl p-5 ${result.ok ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'}`}>
                {result.ok ? (
                  <>
                    <b className="text-emerald-700 text-lg">✅ ایمپورت موفق!</b>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                      <div className="stat text-center"><b className="text-emerald-600">{fa(result.questionsAdded)}</b><span className="text-xs text-slate-400">سوال واردشده</span></div>
                      <div className="stat text-center"><b className="text-rose-600">{fa(result.questionsRejected)}</b><span className="text-xs text-slate-400">ردشده</span></div>
                      <div className="stat text-center"><b className="text-blue-600">{fa(result.chaptersAdded)}</b><span className="text-xs text-slate-400">فصل جدید</span></div>
                      <div className="stat text-center"><b>{result.standardTitle}</b><span className="text-xs text-slate-400">استاندارد</span></div>
                    </div>
                    {result.questionsRejected > 0 && (
                      <p className="text-sm text-amber-600 mt-2">⚠️ {fa(result.questionsRejected)} سوال به‌دلیل گزینه ممنوع یا تکراری رد شد.</p>
                    )}
                    <a href="/admin/bank" className="btn-t btn-sm mt-3 inline-block">رفتن به بانک سوالات برای بازبینی ←</a>
                  </>
                ) : (
                  <b className="text-rose-600">❌ {result.message || result.error || 'خطا در ایمپورت'}</b>
                )}
              </div>
            )}
          </div>
        ) : (
          /* تب راهنما */
          <div className="card">
            <h3 className="font-bold mb-3">📖 راهنمای تولید سوالات با پرامپت</h3>
            <div className="text-sm space-y-3">
              <div className="bg-[#E7ECFF] rounded-lg p-3">
                <b>قدم ۱:</b> متن استاندارد آموزشی را آماده کنید (PDF/Word)
              </div>
              <div className="bg-[#E7ECFF] rounded-lg p-3">
                <b>قدم ۲:</b> پرامپت Master v3 را در ChatGPT یا Claude بدهید + متن استاندارد را Paste کنید
              </div>
              <div className="bg-[#E7ECFF] rounded-lg p-3">
                <b>قدم ۳:</b> پس از تأیید وزن‌ها، فصل به فصل سوالات تولید می‌شود. در پایان «مونتاژ نهایی» بگویید.
              </div>
              <div className="bg-[#E7ECFF] rounded-lg p-3">
                <b>قدم ۴:</b> کل JSON را در فایل <code className="bg-slate-100 px-1 rounded">bank.json</code> ذخیره کنید
              </div>
              <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                <b className="text-emerald-700">قدم ۵:</b> به تب «ایمپورت کامل» برگردید، فایل را انتخاب و ایمپورت کنید ✅
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
