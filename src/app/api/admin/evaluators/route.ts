import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, hashPassword } from '@/lib/auth';

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const evaluators = await prisma.adminUser.findMany({
    where: { role: 'evaluator' },
    select: { id: true, email: true, name: true, groupName: true, active: true, lastLoginAt: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  // آمار عملکرد هر ارزیاب
  const stats = await Promise.all(evaluators.map(async (ev) => {
    const reviews = await prisma.questionReview.findMany({
      where: { reviewerEmail: ev.email },
      select: { action: true, reviewedAt: true },
    });
    return {
      ...ev,
      totalReviews: reviews.length,
      approved: reviews.filter(r => r.action === 'APPROVED').length,
      rejected: reviews.filter(r => r.action === 'REJECTED').length,
      edited: reviews.filter(r => r.action === 'EDITED').length,
    };
  }));

  return NextResponse.json(stats);
}

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { email, password, name, groupName } = await req.json();

  if (!email || !password || !name || !groupName) {
    return NextResponse.json({ error: 'ALL_FIELDS_REQUIRED' }, { status: 422 });
  }

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: 'EMAIL_EXISTS' }, { status: 409 });

  const evaluator = await prisma.adminUser.create({
    data: {
      email, name, groupName,
      passwordHash: hashPassword(password),
      role: 'evaluator',
      active: true,
    },
    select: { id: true, email: true, name: true, groupName: true, active: true },
  });

  return NextResponse.json({ ok: true, evaluator });
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const { id, active } = await req.json();
  await prisma.adminUser.update({ where: { id }, data: { active } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const { id } = await req.json();
  await prisma.adminUser.update({ where: { id }, data: { active: false } });
  return NextResponse.json({ ok: true });
}
