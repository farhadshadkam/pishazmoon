import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { matchGroup } from '@/lib/groups';

const FORBIDDEN = /همه موارد|هیچ‌?کدام|موارد فوق|هر دو|گزینه‌های?\s?[۰-۹0-9]/;

const questionSchema = z.object({
  text: z.string().min(10, 'متن سوال کمتر از ۱۰ کاراکتر است').max(600, 'متن سوال بیش از ۶۰۰ کاراکتر است'),
  options: z.array(z.string().min(1, 'گزینه خالی است')).length(4, 'باید دقیقاً ۴ گزینه باشد'),
  correct: z.number().int().min(1, 'correct باید حداقل ۱ باشد').max(4, 'correct باید حداکثر ۴ باشد'),
  cognitive: z.string().optional(),
  difficulty: z.string().optional(),
  source: z.string().optional(),
});

const chapterSchema = z.object({
  title: z.string().min(2, 'عنوان فصل نامعتبر است'),
  weight: z.number().int().min(1, 'وزن حداقل ۱').max(40, 'وزن حداکثر ۴۰'),
  questions: z.array(questionSchema),
});

const fullSchema = z.object({
  standard: z.object({
    code: z.string().min(2, 'کد استاندارد نامعتبر'),
    groupName: z.string().min(2, 'گروه برنامه‌ریزی درسی نامعتبر'),
    profession: z.string().min(2, 'حرفه نامعتبر'),
    job: z.string().min(2, 'شغل نامعتبر'),
    title: z.string().min(2, 'عنوان استاندارد نامعتبر'),
    hours: z.number().int().min(1, 'ساعت آموزش باید عدد باشد'),
    description: z.string().optional(),
    chapters: z.array(chapterSchema).min(1, 'حداقل یک فصل لازم است'),
  }),
});

const VALID_COGNITIVE = ['یادآوری', 'فهم', 'کاربرد', 'تحلیل', 'ارزیابی'];
const VALID_DIFFICULTY = ['آسان', 'متوسط', 'دشوار'];

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'INVALID_JSON', message: 'فایل JSON قابل خواندن نیست' }, { status: 400 });

  // اگر ساختار کلی غلط است
  if (!body.standard) {
    return NextResponse.json({
      error: 'INVALID_FORMAT',
      message: 'ساختار JSON غلط است — باید با { "standard": { ... } } شروع شود',
      hint: 'ابتدای فایل شما: ' + JSON.stringify(body).slice(0, 100),
    }, { status: 422 });
  }

  // اعتبارسنجی ساختار
  const parsed = fullSchema.safeParse(body);
  if (!parsed.success) {
    const errs = parsed.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`);
    return NextResponse.json({
      error: 'INVALID_FORMAT',
      message: 'خطاهای اعتبارسنجی:',
      errors: errs.slice(0, 10),
      totalErrors: errs.length,
    }, { status: 422 });
  }

  const std = parsed.data.standard;

  // ─── تعریف results (قبل از استفاده) ───
  const results = { chaptersAdded: 0, questionsAdded: 0, questionsRejected: 0, warnings: [] as string[] };

  // ─── تطبیق نام گروه با لیست رسمی ۶۶ گروه ───
  const groupResult = matchGroup(std.groupName);
  if (groupResult.confidence >= 80) {
    if (std.groupName !== groupResult.official) {
      results.warnings.push(`گروه «${std.groupName}» به «${groupResult.official}» تغییر یافت (تطبیق خودکار)`);
    }
    std.groupName = groupResult.official;
  } else {
    results.warnings.push(`گروه «${std.groupName}» با لیست رسمی تطبیق نشد — به صورت دستی بررسی کنید`);
  }

  // ─── اعتبارسنجی وزن ───
  const totalWeight = std.chapters.reduce((a, c) => a + c.weight, 0);
  if (totalWeight !== 40) {
    return NextResponse.json({
      error: 'WEIGHT_MISMATCH',
      message: `جمع وزن فصل‌ها ${totalWeight} است — باید دقیقاً ۴۰ باشد`,
    }, { status: 422 });
  }

  // ─── اعتبارسنجی cognitive و difficulty (هشدار، نه خطا) ───
  for (const ch of std.chapters) {
    for (const q of ch.questions) {
      if (q.cognitive && !VALID_COGNITIVE.includes(q.cognitive)) {
        results.warnings.push(`سوال "${q.text.slice(0, 30)}..." — cognitive نامعتبر: "${q.cognitive}" → به "فهم" تغییر یافت`);
        q.cognitive = 'فهم';
      }
      if (q.difficulty && !VALID_DIFFICULTY.includes(q.difficulty)) {
        results.warnings.push(`سوال "${q.text.slice(0, 30)}..." — difficulty نامعتبر: "${q.difficulty}" → به "متوسط" تغییر یافت`);
        q.difficulty = 'متوسط';
      }
    }
  }

  // ─── استاندارد را پیدا یا بساز ───
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
        price: 98000,
        description: std.description || '',
      },
      include: { chapters: true },
    });
    results.warnings.push(`استاندارد جدید ساخته شد: ${std.title}`);
  }

  // ─── فصل‌ها و سوالات ───
  for (let i = 0; i < std.chapters.length; i++) {
    const ch = std.chapters[i];
    let chapter = standard.chapters.find((c) => c.title.trim() === ch.title.trim());

    if (!chapter) {
      chapter = await prisma.chapter.create({
        data: { standardId: standard.id, title: ch.title, weight: ch.weight, order: i + 1 },
      });
      results.chaptersAdded++;
    }

    for (const q of ch.questions) {
      // بررسی گزینه‌های ممنوع
      if (q.options.some((o) => FORBIDDEN.test(o))) {
        results.questionsRejected++;
        continue;
      }

      // بررسی تکراری
      const dup = await prisma.question.findFirst({ where: { chapterId: chapter.id, text: q.text } });
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

  // ─── ثبت در حسابرسی ───
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
