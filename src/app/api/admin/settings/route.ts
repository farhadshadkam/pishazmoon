import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const items = await prisma.setting.findMany();
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const body = await req.json();

  // پشتیبانی از هر دو حالت: تک‌مقدار یا آرایه
  const entries = Array.isArray(body) ? body : [body];

  for (const { key, value } of entries) {
    if (!key) continue;
    await prisma.setting.upsert({
      where: { key },
      create: { key, value: String(value ?? '') },
      update: { value: String(value ?? '') },
    });
  }

  await prisma.auditLog.create({
    data: { actor: admin.email, action: 'SETTINGS_UPDATE', entity: 'Setting' },
  });

  return NextResponse.json({ ok: true });
}
