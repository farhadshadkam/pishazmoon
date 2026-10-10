import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireEvaluator } from '@/lib/auth';

export async function POST(req: Request) {
  const evaluator = await requireEvaluator(req);
  if (!evaluator || evaluator.role !== 'evaluator') {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { questionId, action } = await req.json();

  if (!['APPROVED', 'REJECTED', 'EDITED', 'FLAGGED'].includes(action)) {
    return NextResponse.json({ error: 'INVALID_ACTION' }, { status: 422 });
  }

  // تغییر وضعیت سوال
  const statusMap: Record<string, string> = {
    APPROVED: 'PUBLISHED',
    REJECTED: 'REJECTED',
    EDITED: 'PUBLISHED',
    FLAGGED: 'PENDING',
  };

  await prisma.question.update({
    where: { id: questionId },
    data: { status: statusMap[action] as any },
  });

  // ثبت عملکرد
  await prisma.questionReview.create({
    data: {
      questionId,
      reviewerEmail: evaluator.email,
      action,
    },
  });

  return NextResponse.json({ ok: true });
}

// آمار عملکرد ارزیاب
export async function GET(req: Request) {
  const evaluator = await requireEvaluator(req);
  if (!evaluator || evaluator.role !== 'evaluator') {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const reviews = await prisma.questionReview.findMany({
    where: { reviewerEmail: evaluator.email },
    orderBy: { reviewedAt: 'desc' },
  });

  // گروه‌بندی روزانه
  const dailyStats: Record<string, { total: number; approved: number; rejected: number; edited: number }> = {};
  for (const r of reviews) {
    const date = new Intl.DateTimeFormat('fa-IR').format(r.reviewedAt);
    if (!dailyStats[date]) dailyStats[date] = { total: 0, approved: 0, rejected: 0, edited: 0 };
    dailyStats[date].total++;
    if (r.action === 'APPROVED') dailyStats[date].approved++;
    if (r.action === 'REJECTED') dailyStats[date].rejected++;
    if (r.action === 'EDITED') dailyStats[date].edited++;
  }

  return NextResponse.json({
    summary: {
      total: reviews.length,
      approved: reviews.filter(r => r.action === 'APPROVED').length,
      rejected: reviews.filter(r => r.action === 'REJECTED').length,
      edited: reviews.filter(r => r.action === 'EDITED').length,
    },
    daily: Object.entries(dailyStats).map(([date, stats]) => ({ date, ...stats })),
  });
}
