import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { consumeOtp, signUserToken } from '@/lib/auth';
import { mobileSchema, registerSchema } from '@/lib/validators';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const mobile = mobileSchema.parse(body.mobile);
    if (!await consumeOtp(mobile, String(body.code ?? '')))
      return NextResponse.json({ error: 'OTP_INVALID' }, { status: 401 });

    let user = await prisma.user.findUnique({ where: { mobile } });
    if (!user) { // ثبت‌نام جدید: پروفایل الزامی
      const p = registerSchema.parse(body.profile);
      if (await prisma.user.findUnique({ where: { nationalId: p.nationalId } }))
        return NextResponse.json({ error: 'NID_EXISTS' }, { status: 409 });
      user = await prisma.user.create({ data: p });
    }
    return NextResponse.json({ token: await signUserToken(user.id),
      user: { id: user.id, name: `${user.firstName} ${user.lastName}` } });
  } catch { return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 422 }); }
}
