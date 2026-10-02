import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  const admin = await requireAdmin(req); if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [paid, todayPaid, attemptCount, userCount] = await Promise.all([
    prisma.order.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
    prisma.order.aggregate({ where: { status: 'PAID', createdAt: { gte: today } }, _sum: { amount: true } }),
    prisma.examAttempt.count({ where: { submittedAt: { not: null } } }),
    prisma.user.count(),
  ]);
  return NextResponse.json({
    todayRevenue: todayPaid._sum.amount || 0, totalRevenue: paid._sum.amount || 0,
    attemptCount, userCount, sales30: Array.from({ length: 30 }, () => 0),
  });
}
