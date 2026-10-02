export default function Guide(){return(<div dir="rtl" className="mt-6"><h1 className="text-2xl font-bold">راهنمای استفاده</h1>
<div className="grid md:grid-cols-2 gap-4 mt-4 items-start"><div className="card"><h3>چطور پیش‌آزمون بگیرم؟</h3>
{['استاندارد هدف را جستجو کنید.','صفحه استاندارد را بررسی کنید.','با فرم مینیمال ثبت‌نام کنید و آنلاین بپردازید.','کد آزمون (اعتبار ۳۰ روز) پیامک می‌شود.','در صفحه ورود: کد + کد ملی + موبایل وارد کنید.','در ۶۰ دقیقه به ۴۰ سؤال پاسخ دهید.','کارنامه تحلیلی ببینید.'].map((s,i)=>(
<div key={i} className="relative pr-12 mb-4"><span className="absolute right-0 top-0 w-9 h-9 rounded-xl bg-[#E7ECFF] text-[#1D2E7A] font-extrabold flex items-center justify-center">{['۱','۲','۳','۴','۵','۶','۷'][i]}</span><span className="text-sm">{s}</span></div>))}
</div><div><h3>سوالات متداول</h3>
{[['اگر مرورگر بسته شود؟','زمان ادامه دارد؛ تا پایان زمان می‌توانید برگردید.'],['نمره منفی دارید؟','خیر.'],['توزیع سؤالات؟','دقیقاً بر اساس وزن مصوب هر فصل از ۴۰.'],['آزمون رسمی است؟','خیر؛ سرویس تمرینی مستقل است.']].map(([q,a])=>(
<details key={q} className="card mb-2 p-4"><summary className="font-bold cursor-pointer">{q}</summary><p className="text-sm text-slate-400 mt-2">{a}</p></details>))}
</div></div></div>)}
