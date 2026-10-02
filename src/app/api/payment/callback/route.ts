// callback — تأیید سمت سرور + صدور کد آزمون + پیامک
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { paymentVerify } from '@/lib/payment';
import { sendSms } from '@/lib/sms';

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const authority = sp.get('Authority') ?? '', status = sp.get('Status'), orderId = sp.get('orderId') ?? '';
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { standard: true, user: true } });
  const fail = () => NextResponse.redirect(`${process.env.APP_URL}/payment/result?status=failed&orderId=${orderId}`);
  if (!order) return fail();
  if (status !== 'OK') { await prisma.order.update({ where: { id: order.id }, data: { status: 'FAILED' } }); return fail(); }
  const v = await paymentVerify(order.amount, authority);
  if (!v.ok || !v.refId) { await prisma.order.update({ where: { id: order.id }, data: { status: 'FAILED' } }); return fail(); }
  const rnd = () => [...Array(4)].map(() => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 31)]).join('');
  const code = `PA-${rnd()}-${rnd()}`;
  await prisma.$transaction([
    prisma.order.update({ where: { id: order.id }, data: { status: 'PAID', refId: String(v.refId) } }),
    prisma.examCode.create({ data: { code, userId: order.userId, standardId: order.standardId,
      orderId: order.id, expiresAt: new Date(Date.now() + 30 * 864e5) } }),
  ]);
  await sendSms(order.user.mobile, `پیش‌آزمون | کد آزمون «${order.standard.title}»: ${code} — اعتبار ۳۰ روز`);
  return NextResponse.redirect(`${process.env.APP_URL}/payment/result?status=ok&code=${code}`);
}
