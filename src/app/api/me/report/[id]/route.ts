import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await requireUser(req); if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const a = await prisma.examAttempt.findUnique({ where: { id: params.id },
    include: { standard: { select: { title: true } }, user: { select: { firstName: true, lastName: true } } } });
  if (!a || a.userId !== user.id) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  return NextResponse.json(a);
}
