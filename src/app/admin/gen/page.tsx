'use client';
import AdminShell from '@/components/AdminShell';
import { post, fa } from '@/lib/client';
import { useState } from 'react';
const STEPS=['دریافت محتوا','پیشنهاد وزن','تولید سوال','ممیزی QA','فصل‌های بعدی','انتقال به بانک'];
export default function AdminGen(){
  const [tab,setTab]=useState<'wiz'|'imp'>('wiz');
  const [file,setFile]=useState(false);const [impStep,setImpStep]=useState(1);
  const [result, setResult] = useState<any>(null);
  const doImport = async () => {
    // در نسخه اصلی: آپلود فایل JSON → POST /admin/questions/import
    setResult(await post('/admin/questions/import', { demo: true }, true));
  };
  return(<AdminShell title="🤖 تولید هوشمند سوالات">
    <div className="flex gap-2 mb-4" dir="rtl">
      <button className={`btn ${tab==='wiz'?'btn-p':'btn-g'} btn-sm`} onClick={()=>setTab('wiz')}>جادوگر عامل AI (شبیه‌سازی)</button>
      <button className={`btn ${tab==='imp'?'btn-p':'btn-g'} btn-sm`} onClick={()=>setTab('imp')}>📥 ایمپورت ساختاریافته</button>
    </div>
    {tab==='imp'?(
      <div dir="rtl">
        <div className="card"><h3>📥 ایمپورت ساختاریافته (پیوست A)</h3>
        <p className="text-sm text-slate-400">خروجی پرامپت تولید محتوا را اینجا بارگذاری کنید.</p>
        <div className="steps mt-3">{['۱. تولید سوالات با پرامپت Master','۲. دریافت خروجی JSON','۳. بارگذاری و ورود به صف بازبینی'].map(s=><div key={s} className="text-sm mb-2">{s}</div>)}</div>
        {impStep===1&&<div className="upbox" onClick={()=>{setImpStep(2);toast('فایل خوانده شد')}}>📄 انتخاب فایل bank-batch.json</div>}
        {impStep===2&&<button className="btn-p" onClick={doImport}>ورود سوالات معتبر</button>}
        {result&&<div className="card mt-3 !bg-emerald-50"><b>✅ {fa(result.ok)} سوال وارد شد؛ {fa(result.rejected)} ردیف رد شد.</b>
          <pre className="text-xs mt-2 overflow-auto max-h-40">{JSON.stringify(result.results,null,1)}</pre></div>}
        </div>
      </div>
    ):(
      <div dir="rtl"><div className="gsteps">{STEPS.map((s,i)=><span key={s} className={`gstep ${i===0?'on':''}`}>{fa(i+1)}. {s}</span>)}</div>
      <div className="card"><p className="text-sm text-slate-400">در نسخه اصلی، عامل هوشمند به‌صورت کامل API-driven اجرا می‌شود. در این فاز، از تب ایمپورت ساختاریافته استفاده کنید.</p>
      <a href="/admin/gen" onClick={e=>{e.preventDefault();setTab('imp')}} className="btn-p mt-3">رفتن به ایمپورت ساختاریافته ←</a></div></div>
    )}
  </AdminShell>)}
function toast(m:string){const d=document.createElement('div');d.className='fixed top-4 right-1/2 translate-x-1/2 bg-[#141E4D] text-white rounded-xl px-5 py-3 z-[200]';d.textContent=m;document.body.appendChild(d);setTimeout(()=>d.remove(),3000)}
