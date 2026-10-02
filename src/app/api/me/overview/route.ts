import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await requireUser(req); if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const [codes, attempts] = await Promise.all([
    prisma.examCode.findMany({ where: { userId: user.id }, include: { standard: { select: { title: true } } }, orderBy: { purchasedAt: 'desc' } }),
    prisma.examAttempt.findMany({ where: { userId: user.id, submittedAt: { not: null } }, include: { standard: { select: { title: true } } }, orderBy: { startedAt: 'desc' } }),
  ]);
  return NextResponse.json({ user, codes, attempts });
}
