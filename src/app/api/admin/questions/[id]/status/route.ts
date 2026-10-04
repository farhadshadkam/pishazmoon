import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const { status } = await req.json();
  await prisma.question.update({ where: { id: params.id }, data: { status } });
  await prisma.auditLog.create({
    data: { actor: admin.email, action: `QUESTION_${status}`, entity: 'Question', entityId: params.id },
  });
  return NextResponse.json({ ok: true });
}
