import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const g = sp.get('g') ?? '', p = sp.get('p') ?? '', j = sp.get('j') ?? '', q = sp.get('q') ?? '';
  const page = Math.max(1, Number(sp.get('page') ?? 1)), ps = Math.min(60, Number(sp.get('ps') ?? 12));
  const where = { published: true,
    ...(g && { groupName: g }), ...(p && { profession: p }), ...(j && { job: j }),
    ...(q && { OR: [{ title: { contains: q } }, { profession: { contains: q } }, { job: { contains: q } }, { code: { contains: q } }] }) };
  const [items, total] = await prisma.$transaction([
    prisma.standard.findMany({ where, orderBy: { title: 'asc' }, skip: (page - 1) * ps, take: ps,
      include: { chapters: { select: { weight: true } } } }),
    prisma.standard.count({ where }),
  ]);
  return NextResponse.json({ items: items.map(s => ({ ...s, totalWeight: s.chapters.reduce((a, c) => a + c.weight, 0) })), total, page, ps });
}
