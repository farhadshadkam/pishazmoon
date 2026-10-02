import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth';
const prisma = new PrismaClient();

async function main() {
  await prisma.setting.createMany({ data: [
    { key: 'siteName', value: 'پیش‌آزمون' },
    { key: 'bale', value: 'https://ble.ir/pishazmoon' },
    { key: 'smsOtp', value: 'پیش‌آزمون | کد تأیید شما: {code}' },
    { key: 'smsCode', value: 'پیش‌آزمون | کد آزمون شما: {code} — اعتبار ۳۰ روز' },
  ], skipDuplicates: true });

  await prisma.adminUser.create({ data: {
    email: process.env.ADMIN_EMAIL || 'admin@pishazmoon.ir',
    passwordHash: hashPassword(process.env.ADMIN_PASSWORD || 'ChangeMe!123'),
    name: 'مدیر سامانه', role: 'superadmin',
  }});

  await prisma.link.createMany({ data: [
    { title: 'سازمان آموزش فنی‌وحرفه‌ای کشور', url: 'https://www.irantvto.ir', order: 1 },
    { title: 'سامانه ملی فنی‌یار', url: 'https://fipir.irantvto.ir', order: 2 },
  ], skipDuplicates: true });

  // استاندارد مرجع + فصل‌ها (بقیه استانداردها از مسیر ایمپورت اکسل ادمین وارد می‌شوند)
  const std = await prisma.standard.create({ data: {
    code: '1005661', groupName: 'فناوری اطلاعات و ارتباطات', profession: 'کار با رایانه',
    job: 'کاربر مقدماتی رایانه', title: 'کاربر مقدماتی رایانه', hours: 72, price: 98000,
    description: 'سنجش شایستگی‌های پایه کار با رایانه.',
    chapters: { create: [
      { title: 'مفاهیم پایه فناوری اطلاعات', weight: 4, order: 1 },
      { title: 'سخت‌افزار رایانه', weight: 5, order: 2 },
      { title: 'سیستم‌عامل و مدیریت فایل', weight: 6, order: 3 },
      { title: 'پردازش متن Word', weight: 8, order: 4 },
      { title: 'صفحه‌گسترده Excel', weight: 8, order: 5 },
      { title: 'ارائه PowerPoint', weight: 3, order: 6 },
      { title: 'اینترنت، ایمیل و امنیت', weight: 6, order: 7 },
    ]},
  }});
  const chs = await prisma.chapter.findMany({ where: { standardId: std.id }, orderBy: { order: 1 } });
  // نمونه: ۴ سوال انتشار‌یافته برای فصل ۱ (برای فعال‌سازی کامل آزمون، ۴۰+ سوال را از ایمپورت پیوست A وارد کنید)
  await prisma.question.createMany({ data: [
    { chapterId: chs[0].id, text: 'کدام گزینه ترتیب صحیح واحدهای حجم داده از کوچک به بزرگ است؟', opt: ['بیت ← بایت ← کیلوبایت ← مگابایت','بایت ← بیت ← کیلوبایت ← مگابایت','کیلوبایت ← بیت ← بایت ← مگابایت','بیت ← کیلوبایت ← بایت ← مگابایت'], correct: 0, cognitive: 'یادآوری', difficulty: 'آسان', status: 'PUBLISHED' },
    { chapterId: chs[0].id, text: 'خروجی پردازش «داده» چه نام دارد؟', opt: ['اطلاعات','بیت','بانک اطلاعاتی','فایل',], correct: 0, cognitive: 'فهم', difficulty: 'آسان', status: 'PUBLISHED' },
    { chapterId: chs[0].id, text: 'گزارشی که از فهرست خام فروش برای مدیرعامل تهیه می‌شود، چه چیزی محسوب می‌شود؟', opt: ['اطلاعات','داده خام','بیت','نرم‌افزار'], correct: 0, cognitive: 'کاربرد', difficulty: 'متوسط', status: 'PUBLISHED' },
    { chapterId: chs[0].id, text: 'حوزه IT عمدتاً به کدام فعالیت مربوط است؟', opt: ['گردآوری، پردازش و انتقال داده‌ها','تولید لوازم خانگی','معماری ساختمان','تأسیسات برقی'], correct: 0, cognitive: 'یادآوری', difficulty: 'آسان', status: 'PUBLISHED' },
  ]});
  console.log('✅ Seed کامل شد (ادمین اولیه + استاندارد مرجع + ۴ سوال نمونه)');
}
main().finally(() => prisma.$disconnect());
