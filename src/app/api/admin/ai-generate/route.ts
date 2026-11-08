import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { callAI, parseAIJson } from '@/lib/ai-client';
import { GENERATION_SYSTEM_PROMPT } from '@/lib/generation-prompt';
import { jaccard, normalize } from '@/lib/groups';

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { standardCode, chapterTitle, questionCount } = await req.json();

  if (!standardCode || !chapterTitle || !questionCount) {
    return NextResponse.json({ error: 'MISSING_FIELDS', message: 'استاندارد، فصل و تعداد سوال الزامی است' }, { status: 422 });
  }

  const count = Math.min(20, Math.max(1, +questionCount));

  // ─── واکشی اطلاعات استاندارد و فصل ───
  const standard = await prisma.standard.findUnique({
    where: { code: standardCode },
    include: {
      chapters: { where: { title: chapterTitle }, include: { questions: { select: { text: true } } } },
    },
  });

  if (!standard) return NextResponse.json({ error: 'STANDARD_NOT_FOUND' }, { status: 404 });

  const chapter = standard.chapters[0];
  if (!chapter) return NextResponse.json({ error: 'CHAPTER_NOT_FOUND' }, { status: 404 });

  // ─── واکشی سوالات منتشرشده این فصل (برای جلوگیری از تکرار) ───
  const existingQuestions = await prisma.question.findMany({
    where: { chapterId: chapter.id, status: { in: ['PUBLISHED', 'APPROVED'] } },
    select: { text: true, opt: true, correct: true },
  });

  // ─── استخراج موضوعات پوشش‌داده‌شده ───
  const coveredTopics = existingQuestions
    .map(q => q.text.slice(0, 80))
    .join('\n- ');

  // ─── ساخت پرامپت کاربر ───
  const userPrompt = `
استاندارد: ${standard.title} (کد: ${standard.code})
فصل: ${chapterTitle}

 ${standard.description ? `شرح استاندارد: ${standard.description}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
موضوعاتی که قبلاً پوشش داده شده‌اند (سوال مشابه نساز):
 ${coveredTopics || '(هیچ سوالی قبلاً ثبت نشده)'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
وظیفه: دقیقاً ${count} سوال چهارگزینه‌ای جدید و متفاوت تولید کن.

قواعد:
- سوالات باید کاملاً متفاوت از سوالات بالا باشند
- از زاویه متفاوتی به مفاهیم نگاه کن
- سناریوها متنوع باشند (کارگاه، دفتر فنی، سایت صنعتی، خط تولید، ...)
- گزینه‌های انحرافی از اشتباهات واقعی کارآموزان ساخته شوند
- زبان طبیعی و غیرقالبی استفاده کن
- گزینه صحیح در جای مختلف قرار بگیرد

خروجی فقط JSON با این ساختار:
{
  "questions": [
    {
      "text": "متن سوال",
      "options": ["گزینه ۱", "گزینه ۲", "گزینه ۳", "گزینه ۴"],
      "correct": 1,
      "cognitive": "یادآوری",
      "difficulty": "آسان",
      "source": "فصل: ${chapterTitle}"
    }
  ]
}
`;

  // ─── فراخوانی AI ───
  let aiResponse: string;
  try {
    aiResponse = await callAI(GENERATION_SYSTEM_PROMPT, userPrompt, 4000);
  } catch (err: any) {
    return NextResponse.json({ error: 'AI_ERROR', message: err.message }, { status: 500 });
  }

  // ─── پارس و اعتبارسنجی ───
  let parsed: any;
  try {
    parsed = parseAIJson(aiResponse);
  } catch (err: any) {
    return NextResponse.json({ error: 'AI_PARSE_ERROR', message: err.message }, { status: 500 });
  }

  const generatedQuestions: any[] = parsed.questions || [];
  if (generatedQuestions.length === 0) {
    return NextResponse.json({ error: 'NO_QUESTIONS_GENERATED' }, { status: 500 });
  }

  // ─── بررسی تکراری بودن با سوالات موجود ───
  const accepted: any[] = [];
  const rejected: { text: string; reason: string }[] = [];

  for (const q of generatedQuestions) {
    // ساختار
    if (!q.text || q.text.length < 10) { rejected.push({ text: q.text || '', reason: 'متن کوتاه' }); continue; }
    if (!q.options || q.options.length !== 4) { rejected.push({ text: q.text || '', reason: 'تعداد گزینه ≠ ۴' }); continue; }
    if (q.correct < 1 || q.correct > 4) { rejected.push({ text: q.text || '', reason: 'پاسخ صحیح نامعتبر' }); continue; }

    // گزینه‌های ممنوع
    const FORBIDDEN = /همه موارد|هیچ‌?کدام|موارد فوق|هر دو/;
    if (q.options.some((o: string) => FORBIDDEN.test(o))) {
      rejected.push({ text: q.text, reason: 'گزینه ممنوع' });
      continue;
    }

    // تکراری با سوالات موجود
    const isDup = existingQuestions.some(eq => jaccard(normalize(q.text), normalize(eq.text)) > 0.70);
    if (isDup) { rejected.push({ text: q.text, reason: 'مشابه سوال موجود' }); continue; }

    // تکراری با سوالات قبلاً پذیرفته‌شده در همین batch
    const isDupInBatch = accepted.some(aq => jaccard(normalize(q.text), normalize(aq.text)) > 0.70);
    if (isDupInBatch) { rejected.push({ text: q.text, reason: 'تکراری در همین batch' }); continue; }

    accepted.push(q);
  }

  // ─── ذخیره در بانک ───
  const savedQuestions: any[] = [];
  for (const q of accepted) {
    const saved = await prisma.question.create({
      data: {
        chapterId: chapter.id,
        text: q.text,
        opt: q.options,
        correct: q.correct - 1,
        cognitive: q.cognitive || 'فهم',
        difficulty: q.difficulty || 'متوسط',
        source: q.source || `تولید AI — فصل: ${chapterTitle}`,
        aiGenerated: true,
        status: 'PENDING',
      },
    });
    savedQuestions.push(saved);
  }

  await prisma.auditLog.create({
    data: {
      actor: admin.email,
      action: 'AI_GENERATE',
      entity: 'Question',
      entityId: chapter.id,
      meta: {
        chapter: chapterTitle,
        standard: standardCode,
        requested: count,
        generated: generatedQuestions.length,
        accepted: accepted.length,
        rejected: rejected.length,
      },
    },
  });

  return NextResponse.json({
    ok: true,
    chapterTitle,
    requested: count,
    generated: generatedQuestions.length,
    accepted: savedQuestions.length,
    rejected: rejected.length,
    rejectedDetails: rejected.map(r => ({ text: r.text.slice(0, 50), reason: r.reason })),
    savedQuestions: savedQuestions.map(q => ({ id: q.id, text: q.text.slice(0, 60) })),
  });
}
