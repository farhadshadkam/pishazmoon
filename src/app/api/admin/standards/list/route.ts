import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
export async function GET(req: Request) {
  const admin = await requireAdmin(req); if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const sp = new URL(req.url).searchParams;
  const q = sp.get('q') || '', g = sp.get('g') || '', p = sp.get('p') || '', j = sp.get('j') || '', s = sp.get('s') || '';
  const page = Math.max(1, +(sp.get('page') || 1)), ps = sp.get('ps') === 'all' ? 1000 : Math.min(100, +(sp.get('ps') || 10));
  const stdCodes = s ? [s] : undefined;
  const where = { ...(q && { OR: [{ title: { contains: q } }, { profession: { contains: q } }, { job: { contains: q } }, { code: { contains: q } }] }),
    ...(g && { groupName: g }), ...(p && { profession: p }), ...(j && { job: j }), ...(stdCodes && { code: { in: stdCodes } }) };
  const [items, total] = await prisma.$transaction([
    prisma.standard.findMany({ where, skip: (page - 1) * ps, take: ps, include: { chapters: { select: { weight: true } } }, orderBy: { title: 'asc' } }),
    prisma.standard.count({ where }),
  ]);
  const gs = [...new Set((await prisma.standard.findMany({ select: { groupName: true } })).map((x) => x.groupName))];
  return NextResponse.json({ items, total, hierOpts: { gs, ps: [], js: [], ss: [] } });
}
