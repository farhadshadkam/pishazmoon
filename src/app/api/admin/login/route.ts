import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { signAdminToken, verifyPassword } from '@/lib/auth';

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const admin = await prisma.adminUser.findUnique({ where: { email } });

  if (!admin || !verifyPassword(String(password), admin.passwordHash)) {
    return NextResponse.json({ error: 'INVALID_CREDENTIALS' }, { status: 401 });
  }

  if (!admin.active) {
    return NextResponse.json({ error: 'ACCOUNT_SUSPENDED', message: 'حساب شما غیرفعال شده است' }, { status: 403 });
  }

  await prisma.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });

  return NextResponse.json({
    token: await signAdminToken(admin.id),
    role: admin.role,
    name: admin.name,
    groupName: admin.groupName,
  });
}
