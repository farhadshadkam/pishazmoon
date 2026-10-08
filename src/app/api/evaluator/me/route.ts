import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireEvaluator } from '@/lib/auth';

export async function GET(req: Request) {
  const evaluator = await requireEvaluator(req);
  if (!evaluator) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  return NextResponse.json({
    id: evaluator.id,
    name: evaluator.name,
    email: evaluator.email,
    groupName: evaluator.groupName,
    role: evaluator.role,
  });
}
