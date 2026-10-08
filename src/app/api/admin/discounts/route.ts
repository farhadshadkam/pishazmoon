import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const items = await prisma.discountCode.findMany({ orderBy: { createdAt: 'desc' }, include: { _count: { select: { orders: true } } } });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { code, percentage, maxUses, expiresAt, note } = await req.json();

  if (!code || !percentage || percentage < 1 || percentage > 100) {
    return NextResponse.json({ error: 'INVALID' }, { status: 422 });
  }

  const existing = await prisma.discountCode.findUnique({ where: { code: code.toUpperCase() } });
  if (existing) return NextResponse.json({ error: 'DUPLICATE' }, { status: 409 });

  const created = await prisma.discountCode.create({
    data: {
      code: code.toUpperCase().trim(),
      percentage: +percentage,
      maxUses: maxUses ? +maxUses : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      note: note || '',
    },
  });

  return NextResponse.json({ ok: true, discount: created });
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const { id, active } = await req.json();
  await prisma.discountCode.update({ where: { id }, data: { active } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const { id } = await req.json();
  await prisma.discountCode.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
