import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

const FORBIDDEN = /همه موارد|هیچ‌?کدام|موارد فوق|هر دو|گزینه‌های?\s?[۰-۹0-9]/;

const questionSchema = z.object({
  text: z.string().min(10).max(600),
  options: z.array(z.string().min(1)).length(4),
  correct: z.number().int().min(1).max(4),
  cognitive: z.enum(['یادآوری', 'فهم', 'کاربرد', 'تحلیل', 'ارزیابی']).optional(),
  difficulty: z.enum(['آسان', 'متوسط', 'دشوار']).optional(),
  source: z.string().optional(),
});

const chapterSchema = z.object({
  title: z.string().min(2),
  weight: z.number().int().min(1).max(40),
  questions: z.array(questionSchema),
});

const fullSchema = z.object({
  standard: z.object({
    code: z.string().min(2),
    groupName: z.string().min(2),
    profession: z.string().min(2),
    job: z.string().min(2),
    title: z.string().min(2),
    hours: z.number().int().min(1),
    description: z.string().optional(),
    chapters: z.array(chapterSchema).min(1),
  }),
});

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = fullSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_FORMAT', details: parsed.error.flatten() }, { status: 422 });
  }

  const std = parsed.data.standard;
  const results = { chaptersAdded: 0, questionsAdded: 0, questionsRejected: 0, errors: [] as string[] };

  // اعتبارسنجی: جمع وزن فصل‌ها باید ۴۰ باشد
  const totalWeight = std.chapters.reduce((a, c) => a + c.weight, 0);
  if (totalWeight !== 40) {
    return NextResponse.json({
      error: 'WEIGHT_MISMATCH',
      message: `جمع وزن فصل‌ها ${totalWeight} است — باید دقیقاً ۴۰ باشد`,
    }, { status: 422 });
  }

  // استاندارد را پیدا یا بساز
  let standard = await prisma.standard.findUnique({ where: { code: std.code }, include: { chapters: true } });

  if (!standard) {
    standard = await prisma.standard.create({
      data: {
        code: std.code,
        groupName: std.groupName,
        profession: std.profession,
        job: std.job,
        title: std.title,
        hours: std.hours,
        price: 98000, // پیش‌فرض — از پنل قابل ویرایش
        description: std.description || '',
      },
      include: { chapters: true },
    });
    results.errors.push(`استاندارد جدید ساخته شد: ${std.title}`);
  }

  // فصل‌ها را بساز (اگر تکراری بود، رد کن)
  for (let i = 0; i < std.chapters.length; i++) {
    const ch = std.chapters[i];
    const existing = standard.chapters.find((c) => c.title.trim() === ch.title.trim());

    let chapter = existing;
    if (!chapter) {
      chapter = await prisma.chapter.create({
        data: { standardId: standard.id, title: ch.title, weight: ch.weight, order: i + 1 },
      });
      results.chaptersAdded++;
    }

    // سوالات را اعتبارسنجی و وارد کن
    for (const q of ch.questions) {
      // بررسی گزینه‌های ممنوع
      if (q.options.some((o) => FORBIDDEN.test(o))) {
        results.questionsRejected++;
        continue;
      }
      // بررسی تکراری
      const dup = await prisma.question.findFirst({
        where: { chapterId: chapter.id, text: q.text },
      });
      if (dup) {
        results.questionsRejected++;
        continue;
      }
      // وارد کردن با وضعیت «در انتظار بازبینی»
      await prisma.question.create({
        data: {
          chapterId: chapter.id,
          text: q.text,
          opt: q.options,
          correct: q.correct - 1,
          cognitive: q.cognitive || 'فهم',
          difficulty: q.difficulty || 'متوسط',
          source: q.source || '',
          aiGenerated: true,
          status: 'PENDING',
        },
      });
      results.questionsAdded++;
    }
  }

  await prisma.auditLog.create({
    data: {
      actor: admin.email,
      action: 'FULL_IMPORT',
      entity: 'Standard',
      entityId: standard.id,
      meta: results,
    },
  });

  return NextResponse.json({
    ok: true,
    standardTitle: std.title,
    standardCode: std.code,
    ...results,
  });
}
