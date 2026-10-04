import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const sp = new URL(req.url).searchParams;
  const q = sp.get('q') || '';
  const status = sp.get('status') || '';
  const g = sp.get('g') || '';
  const p = sp.get('p') || '';
  const j = sp.get('j') || '';
  const s = sp.get('s') || '';
  const ch = sp.get('ch') || '';
  const page = Math.max(1, +(sp.get('page') || 1));
  const ps = sp.get('ps') === 'all' ? 1000 : Math.min(100, +(sp.get('ps') || 20));

  const where = {
    ...(status && { status: status as any }),
    ...(q && { text: { contains: q } }),
    ...((g || p || j || s || ch) && {
      chapter: {
        ...(ch && { title: { contains: ch } }),
        ...((g || p || j || s) && {
          standard: {
            ...(g && { groupName: g }),
            ...(p && { profession: p }),
            ...(j && { job: j }),
            ...(s && { code: s }),
          },
        }),
      },
    }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.question.findMany({
      where, skip: (page - 1) * ps, take: ps,
      orderBy: { createdAt: 'desc' },
      include: {
        chapter: { select: { title: true, weight: true, standard: { select: { title: true, code: true, groupName: true } } } },
      },
    }),
    prisma.question.count({ where }),
  ]);

  // گزینه‌های فیلتر سلسله‌مراتبی
  const allStandards = await prisma.standard.findMany({ select: { code: true, groupName: true, profession: true, job: true } });
  const gs = [...new Set(allStandards.map((x) => x.groupName))];
  const ps_opts = g ? [...new Set(allStandards.filter((x) => x.groupName === g).map((x) => x.profession))] : [];
  const js_opts = (g && p) ? [...new Set(allStandards.filter((x) => x.groupName === g && x.profession === p).map((x) => x.job))] : [];

  return NextResponse.json({ items, total, page, ps, hierOpts: { gs, ps: ps_opts, js: js_opts, ss: [] } });
}
