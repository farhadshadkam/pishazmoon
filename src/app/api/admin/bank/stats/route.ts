import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const standards = await prisma.standard.findMany({
    where: { published: true },
    include: {
      chapters: {
        orderBy: { order: 'asc' },
        select: {
          id: true, title: true, weight: true,
          _count: { select: { questions: { where: { status: 'PUBLISHED' } } } },
        },
      },
    },
    orderBy: { title: 'asc' },
  });

  // شمارش وضعیت‌ها برای هر استاندارد
  const stats = await Promise.all(standards.map(async (std) => {
    const [published, pending, rejected] = await Promise.all([
      prisma.question.count({ where: { chapter: { standardId: std.id }, status: 'PUBLISHED' } }),
      prisma.question.count({ where: { chapter: { standardId: std.id }, status: 'PENDING' } }),
      prisma.question.count({ where: { chapter: { standardId: std.id }, status: 'REJECTED' } }),
    ]);

    return {
      id: std.id,
      code: std.code,
      groupName: std.groupName,
      profession: std.profession,
      job: std.job,
      title: std.title,
      chapters: std.chapters.map((ch) => ({
        title: ch.title,
        weight: ch.weight,
        published: ch._count.questions,
        required: ch.weight * 10,
      })),
      totalPublished: published,
      totalPending: pending,
      totalRejected: rejected,
      totalRequired: std.chapters.reduce((a, c) => a + c.weight * 10, 0),
    };
  }));

  const summary = {
    totalStandards: stats.length,
    totalPublished: stats.reduce((a, s) => a + s.totalPublished, 0),
    totalPending: stats.reduce((a, s) => a + s.totalPending, 0),
    totalRejected: stats.reduce((a, s) => a + s.totalRejected, 0),
    totalRequired: stats.reduce((a, s) => a + s.totalRequired, 0),
  };

  return NextResponse.json({ standards: stats, summary });
}
