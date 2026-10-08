import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { code, standardId } = await req.json();

  const discount = await prisma.discountCode.findUnique({
    where: { code: String(code).toUpperCase().trim() },
  });

  if (!discount || !discount.active) {
    return NextResponse.json({ valid: false, message: 'کد تخفیف یافت نشد یا غیرفعال است' });
  }

  if (discount.expiresAt && discount.expiresAt < new Date()) {
    return NextResponse.json({ valid: false, message: 'این کد تخفیف منقضی شده است' });
  }

  if (discount.maxUses && discount.usedCount >= discount.maxUses) {
    return NextResponse.json({ valid: false, message: 'ظرفیت استفاده از این کد تکمیل شده است' });
  }

  const std = await prisma.standard.findUnique({ where: { id: standardId } });
  if (!std) return NextResponse.json({ valid: false, message: 'استاندارد یافت نشد' });

  const discountAmount = Math.round((std.price * discount.percentage) / 100);
  const finalAmount = std.price - discountAmount;

  return NextResponse.json({
    valid: true,
    code: discount.code,
    percentage: discount.percentage,
    originalPrice: std.price,
    discountAmount,
    finalAmount,
    message: discount.percentage === 100
      ? '🎉 این کد ۱۰۰٪ تخفیف دارد — آزمون رایگان!'
      : `✅ ${discount.percentage}٪ تخفیف اعمال شد`,
  });
}
