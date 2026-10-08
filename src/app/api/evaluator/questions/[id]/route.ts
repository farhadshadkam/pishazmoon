import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireEvaluator } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const evaluator = await requireEvaluator(req);
  if (!evaluator) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const body = await req.json();
  const data: any = {};

  if (body.text) data.text = body.text;
  if (body.options && body.options.length === 4) data.opt = body.options;
  if (body.correct !== undefined && body.correct >= 0 && body.correct <= 3) data.correct = body.correct;
  if (body.difficulty) data.difficulty = body.difficulty;
  if (body.cognitive) data.cognitive = body.cognitive;

  await prisma.question.update({ where: { id: params.id }, data });
  return NextResponse.json({ ok: true });
}
