import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// ویرایش سوال
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const body = await req.json();
  const data: any = {};

  if (body.text) data.text = body.text;
  if (body.options && body.options.length === 4) data.opt = body.options;
  if (body.correct !== undefined && body.correct >= 0 && body.correct <= 3) data.correct = body.correct;
  if (body.difficulty) data.difficulty = body.difficulty;
  if (body.cognitive) data.cognitive = body.cognitive;
  if (body.source !== undefined) data.source = body.source;

  const updated = await prisma.question.update({
    where: { id: params.id },
    data,
  });

  await prisma.auditLog.create({
    data: { actor: admin.email, action: 'QUESTION_EDIT', entity: 'Question', entityId: params.id },
  });

  return NextResponse.json({ ok: true, question: updated });
}
