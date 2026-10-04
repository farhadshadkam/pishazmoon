import { prisma } from '@/lib/db';
import BuyButton from './BuyButton';
export default async function StdDetail({ params }: { params: { code: string } }) {
  const s = await prisma.standard.findUnique({ where: { code: params.code }, include: { chapters: { orderBy: { order: 'asc' } } } });
  if (!s) return <p className="p-10 text-center">استاندارد یافت نشد.</p>;
  const bankTotal = await prisma.question.count({ where: { chapter: { standardId: s.id }, status: 'PUBLISHED' } });
  return (<div dir="rtl" className="grid md:grid-cols-2 gap-6 mt-6 items-start">
    <div>
      <code className="text-xs bg-slate-100 px-2 rounded">کد استاندارد {s.code}</code>
      <h1 className="text-2xl font-bold mt-2">{s.title}</h1>
      <p className="text-sm text-slate-400">{s.groupName} › {s.profession} › {s.job} | 🕐 {s.hours} ساعت</p>
      <p className="mt-3">{s.description}</p>
      <h3 className="mt-6 mb-2">فصل‌های آموزشی و وزن‌بندی (از ۴۰)</h3>
      <div className="card p-3">
        {s.chapters.map((c, i) => (
          <div key={c.id} className="flex items-center gap-3 py-2 border-b last:border-0 border-dashed">
            <b className="min-w-6">{new Intl.NumberFormat('fa-IR').format(i + 1)}.</b>
            <span className="flex-1">{c.title}</span>
            <span className="b-info">وزن {c.weight}</span>
          </div>))}
      </div>
    </div>
    <div className="card sticky top-24">
      <h3>مشخصات پیش‌آزمون</h3>
      {[['تعداد سؤال','۴۰ چهارگزینه‌ای'],['زمان آزمون',`${s.examMinutes} دقیقه`],['حد نصاب',`${s.passPct}٪ (${Math.round(40 * s.passPct / 100)} از ۴۰)`],['نمره منفی','ندارد'],['اعتبار کد','۳۰ روز — یک‌بارمصرف']].map(([k, v]) => (
        <div key={k} className="flex justify-between py-1.5 border-b border-dashed text-sm"><span className="text-slate-400">{k}</span><b>{v}</b></div>))}
      <div className="text-center mt-4">
        <div className="text-sm text-slate-400">مبلغ پیش‌آزمون</div>
        <div className="text-3xl font-extrabold text-[#1D2E7A]">{new Intl.NumberFormat('fa-IR').format(s.price)} <span className="text-sm">تومان</span></div>
        <BuyButton standardId={s.id} bankReady={bankTotal >= 40} />
      </div>
    </div>
  </div>);
}
