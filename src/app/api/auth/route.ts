import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { issueOtp } from '@/lib/auth';
import { sendSms } from '@/lib/sms';
import { mobileSchema } from '@/lib/validators';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const mobile = mobileSchema.safeParse(body.mobile);
  if (!mobile.success) return NextResponse.json({ error: 'MOBILE_INVALID' }, { status: 422 });
  const r = await issueOtp(mobile.data);
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: 429 });
  await sendSms(mobile.data, `پیش‌آزمون | کد تأیید شما: ${r.code}`);
  return NextResponse.json({ sent: true, ...(process.env.NODE_ENV !== 'production' && { devCode: r.code }) });
}
