import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireEvaluator } from '@/lib/auth';

export async function GET(req: Request) {
  const evaluator = await requireEvaluator(req);
  if (!evaluator || evaluator.role !== 'evaluator') {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  if (!evaluator.groupName) {
    return NextResponse.json({ error: 'NO_GROUP_ASSIGNED', message: 'به این ارزیاب گروهی اختصاص داده نشده است' }, { status: 400 });
  }
  const sp = new URL(req.url).searchParams;
  const status = sp.get('status') || 'PENDING';
  const page = Math.max(1, +(sp.get('page') || 1));
  const ps = 20;

  const where = {
    status: status as any,
    chapter: {
      standard: {
        groupName: evaluator.groupName,
        published: true,
      },
    },
  };

  const [items, total] = await prisma.$transaction([
    prisma.question.findMany({
      where, skip: (page - 1) * ps, take: ps,
      orderBy: { createdAt: 'desc' },
      include: {
        chapter: { select: { title: true, standard: { select: { title: true, code: true } } } },
      },
    }),
    prisma.question.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, ps });
}
