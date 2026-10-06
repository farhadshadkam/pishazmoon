import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  // ۱. ثبت‌نام کاربران به تفکیک ماه (۱۲ ماه اخیر)
  const users = await prisma.user.findMany({
    where: { createdAt: { gte: twelveMonthsAgo } },
    select: { createdAt: true },
  });
  const monthlyUsers: { month: string; count: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    monthlyUsers.push({
      month: new Intl.DateTimeFormat('fa-IR', { month: 'short' }).format(d),
      count: users.filter(u => u.createdAt >= d && u.createdAt < next).length,
    });
  }

  // ۲. آزمون‌های برگزارشده به تفکیک ماه
  const attempts = await prisma.examAttempt.findMany({
    where: { startedAt: { gte: twelveMonthsAgo }, submittedAt: { not: null } },
    select: { startedAt: true, score: true, passed: true },
  });
  const monthlyAttempts = monthlyUsers.map((m, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - idx), 1);
    const next = new Date(now.getFullYear(), now.getMonth() - (11 - idx) + 1, 1);
    return {
      month: m.month,
      count: attempts.filter(a => a.startedAt >= d && a.startedAt < next).length,
    };
  });

  // ۳. درآمد ماهانه
  const orders = await prisma.order.findMany({
    where: { status: 'PAID', createdAt: { gte: twelveMonthsAgo } },
    select: { createdAt: true, amount: true },
  });
  const monthlyRevenue = monthlyUsers.map((m, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - idx), 1);
    const next = new Date(now.getFullYear(), now.getMonth() - (11 - idx) + 1, 1);
    return {
      month: m.month,
      amount: orders.filter(o => o.createdAt >= d && o.createdAt < next).reduce((a, o) => a + o.amount, 0),
    };
  });

  // ۴. کاربران به تفکیک گروه برنامه‌ریزی درسی
  const standards = await prisma.standard.findMany({
    select: { id: true, code: true, groupName: true, title: true, published: true },
  });
  const examCodes = await prisma.examCode.findMany({
    select: { userId: true, standardId: true },
  });
  const groupStats = [...new Set(standards.map(s => s.groupName))].map(gn => {
    const stdIds = standards.filter(s => s.groupName === gn).map(s => s.id);
    const userCount = new Set(examCodes.filter(c => stdIds.includes(c.standardId)).map(c => c.userId)).size;
    return { groupName: gn, userCount, standardCount: stdIds.length };
  });

  // ۵. آمار کلی
  const [totalUsers, totalAttempts, totalRevenue, totalQuestions, publishedQuestions, pendingQuestions] = await Promise.all([
    prisma.user.count(),
    prisma.examAttempt.count({ where: { submittedAt: { not: null } } }),
    prisma.order.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
    prisma.question.count(),
    prisma.question.count({ where: { status: 'PUBLISHED' } }),
    prisma.question.count({ where: { status: 'PENDING' } }),
  ]);

  // ۶. نرخ قبولی
  const passCount = attempts.filter(a => a.passed).length;
  const passRate = attempts.length > 0 ? Math.round((passCount / attempts.length) * 100) : 0;

  return NextResponse.json({
    monthlyUsers,
    monthlyAttempts,
    monthlyRevenue,
    groupStats,
    summary: {
      totalUsers,
      totalAttempts,
      totalRevenue: totalRevenue._sum.amount || 0,
      totalQuestions,
      publishedQuestions,
      pendingQuestions,
      passRate,
      avgScore: attempts.length > 0 ? Math.round(attempts.reduce((a, x) => a + (x.score || 0), 0) / attempts.length) : 0,
    },
    standards,
  });
}
