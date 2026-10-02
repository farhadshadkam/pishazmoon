import Link from 'next/link';
import { prisma } from '@/lib/db';
export default async function StandardsPage({ searchParams }: { searchParams: { q?: string; g?: string; page?: string } }) {
  const q = searchParams.q || '', g = searchParams.g || '', page = Math.max(1, +((searchParams.page as string) || 1)), ps = 12;
  const where = { published: true, ...(g && { groupName: g }), ...(q && { OR: [{ title: { contains: q } }, { profession: { contains: q } }, { job: { contains: q } }, { code: { contains: q } }] }) };
  const [items, total, groups] = await prisma.$transaction([
    prisma.standard.findMany({ where, skip: (page - 1) * ps, take: ps, include: { chapters: { select: { weight: true } } }, orderBy: { title: 'asc' } }),
    prisma.standard.count({ where }),
    prisma.standard.groupBy({ by: ['groupName'], where: { published: true } }),
  ]);
  const pages = Math.ceil(total / ps);
  return (<div dir="rtl">
    <h1 className="text-2xl font-bold mt-6">فهرست استانداردها</h1>
    <p className="text-sm text-slate-400">گروه برنامه‌ریزی درسی › حرفه › شغل › استاندارد — {new Intl.NumberFormat('fa-IR').format(total)} استاندارد</p>
    <form className="card p-3.5 my-4 flex gap-3">
      <input name="q" defaultValue={q} className="inp" placeholder="🔍 جستجو در عنوان، حرفه، شغل یا کد…" />
      <select name="g" defaultValue={g} className="inp"><option value="">همه گروه‌ها</option>{groups.map((x) => <option key={x.groupName}>{x.groupName}</option>)}</select>
      <button className="btn-p">فیلتر</button>
    </form>
    <div className="grid md:grid-cols-3 gap-4">
      {items.map((s) => (
        <div key={s.id} className="card flex flex-col gap-2 hover:-translate-y-1 transition">
          <div className="flex justify-between items-center"><code className="text-xs bg-slate-100 px-2 rounded">کد {s.code}</code><span className="b-ok">آزمون فعال</span></div>
          <h3 className="font-bold">{s.title}</h3>
          <p className="text-xs text-slate-400">{s.groupName} › {s.job}</p>
          <p className="text-xs">🕐 {s.hours} ساعت | {s.chapters.reduce((a, c) => a + c.weight, 0)} سوال | {new Intl.NumberFormat('fa-IR').format(s.price)} تومان</p>
          <Link href={`/standards/${s.code}`} className="btn-p btn-sm mt-auto self-start">مشاهده و خرید</Link>
        </div>))}
    </div>
    {pages > 1 && <div className="flex gap-2 justify-center mt-6">{Array.from({ length: pages }, (_, i) => (
      <Link key={i} href={`/standards?page=${i + 1}${q ? `&q=${q}` : ''}${g ? `&g=${g}` : ''}`} className={`btn ${page === i + 1 ? 'btn-p' : 'btn-g'} btn-sm`}>{new Intl.NumberFormat('fa-IR').format(i + 1)}</Link>))}</div>}
  </div>);
}
