import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const sp = new URL(req.url).searchParams;
  const status = sp.get('status') || '';
  const page = Math.max(1, +(sp.get('page') || 1));
  const ps = sp.get('ps') === 'all' ? 1000 : Math.min(100, +(sp.get('ps') || 50));

  const where = {
    ...(status && { status: status as any }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.question.findMany({
      where,
      skip: (page - 1) * ps,
      take: ps,
      orderBy: { createdAt: 'desc' },
      include: {
        chapter: {
          select: { title: true, standard: { select: { title: true, code: true } } },
        },
      },
    }),
    prisma.question.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, ps });
}
