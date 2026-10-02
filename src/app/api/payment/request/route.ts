// request
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { paymentRequest } from '@/lib/payment';

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const { standardId } = await req.json();
  const std = await prisma.standard.findUnique({ where: { id: standardId } });
  if (!std || !std.published) return NextResponse.json({ error: 'STANDARD_NOT_FOUND' }, { status: 404 });
  const order = await prisma.order.create({ data: { userId: user.id, standardId, amount: std.price } });
  const r = await paymentRequest(std.price, `${process.env.APP_URL}/api/payment/callback?orderId=${order.id}`, `پیش‌آزمون ${std.title}`);
  if (!r.authority) { await prisma.order.update({ where: { id: order.id }, data: { status: 'FAILED' } });
    return NextResponse.json({ error: 'GATEWAY_ERROR' }, { status: 502 }); }
  await prisma.order.update({ where: { id: order.id }, data: { authority: r.authority } });
  return NextResponse.json({ redirect: r.redirect });
}
