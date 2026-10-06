import Splash from '@/components/Splash';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const pop = await prisma.standard.findMany({ where: { published: true }, take: 3, orderBy: { code: 'asc' },
    include: { chapters: { select: { weight: true } } } });

  return (
    <div dir="rtl">
      <Splash />
      <section className="rounded-3xl p-10 md:p-14 mt-6 text-white" style={{ background: 'linear-gradient(135deg,#141E4D 0%,#1D2E7A 45%,#0E9C9C 130%)' }}>
        <h1 className="text-3xl md:text-5xl font-extrabold">قبل از آزمون اصلی،<br />خودت را محک بزن.</h1>
        <p className="mt-3 opacity-90 max-w-lg">پیش‌آزمون‌های ۴۰ سؤالیِ منطبق بر وزن‌بندی فصل‌های استانداردهای شایستگی — همراه کارنامه تحلیلی نقاط قوت و ضعف.</p>
        <div className="flex gap-3 mt-6 flex-wrap">
          <a href="/standards" className="btn mt-2 !bg-[#F5A623] !text-[#3d2a00] !px-8 !py-3.5 !text-base font-bold">شروع کن</a>
          <a href="/guide" className="btn mt-2 !bg-white/15 !text-white !border-white/20 !px-8 !py-3.5 !text-base">چطور کار می‌کند؟</a>
        </div>
      </section>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-4">
        <div className="stat text-center"><b>+۲۴۰</b><span className="text-xs text-slate-400">استاندارد فعال</span></div>
        <div className="stat text-center"><b>۴۰</b><span className="text-xs text-slate-400">سؤال مطابق وزن فصل‌ها</span></div>
        <div className="stat text-center"><b>۹۲٪</b><span className="text-xs text-slate-400">رضایت آزمون‌دهندگان</span></div>
        <div className="stat text-center"><b>۳۰</b><span className="text-xs text-slate-400">روز اعتبار کد آزمون</span></div>
      </div>

      <h2 className="text-2xl font-bold mt-10">پیش‌آزمون‌های پرطرفدار</h2>
      <div className="grid md:grid-cols-3 gap-4 mt-4">
        {pop.map((s) => (
          <div key={s.id} className="card flex flex-col gap-2 hover:-translate-y-1 transition">
            <div className="flex justify-between items-center">
              <code className="text-xs bg-slate-100 px-2 rounded">کد {s.code}</code>
              <span className="b-ok">آزمون فعال</span>
            </div>
            <h3 className="font-bold">{s.title}</h3>
            <p className="text-xs text-slate-400">{s.groupName} › {s.job}</p>
            <p className="text-xs">🕐 {s.hours} ساعت | {new Intl.NumberFormat('fa-IR').format(s.price)} تومان</p>
            <a href={`/standards/${s.code}`} className="btn-p btn-sm mt-auto self-start">مشاهده و خرید</a>
          </div>
        ))}
      </div>

      <div className="card text-center mt-8 !bg-gradient-to-br !from-[#1D2E7A] !to-[#0E9C9C] !text-white !border-0">
        <h2 className="text-xl font-bold">آماده‌ای محک بزنی؟</h2>
        <a href="/standards" className="btn mt-3 !bg-[#F5A623] !text-[#3d2a00] font-bold">انتخاب استاندارد</a>
      </div>
    </div>
  );
}
