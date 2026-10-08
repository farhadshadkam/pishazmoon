import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireEvaluator, hashPassword, verifyPassword } from '@/lib/auth';

export async function PUT(req: Request) {
  const evaluator = await requireEvaluator(req);
  if (!evaluator) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { name, oldPassword, newPassword } = await req.json();
  const data: any = {};

  if (name && name.length >= 2) data.name = name;

  if (newPassword && newPassword.length >= 6) {
    if (!oldPassword || !verifyPassword(oldPassword, evaluator.passwordHash)) {
      return NextResponse.json({ error: 'WRONG_PASSWORD' }, { status: 401 });
    }
    data.passwordHash = hashPassword(newPassword);
  }

  if (Object.keys(data).length > 0) {
    await prisma.adminUser.update({ where: { id: evaluator.id }, data });
  }

  return NextResponse.json({ ok: true });
}
