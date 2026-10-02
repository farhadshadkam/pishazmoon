import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

const FORBIDDEN = /همه موارد|هیچ‌?کدام|موارد فوق|هر دو|گزینه‌های?\s?[۰-۹0-9]/;
const rowSchema = z.object({
  standardCode: z.string(),
  chapterTitle: z.string(),
  id: z.string().optional(),
  text: z.string().min(10).max(600),
  options: z.array(z.string().min(1)).length(4),
  correct: z.number().int().min(1).max(4),
  cognitive: z.enum(['یادآوری', 'فهم', 'کاربرد', 'تحلیل', 'ارزیابی']).optional(),
  difficulty: z.enum(['آسان', 'متوسط', 'دشوار']).optional(),
  source: z.string().optional(),
});

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const rows: unknown[] = await req.json();
  const results: { row: number; ok: boolean; reason?: string }[] = [];
  for (const [i, row] of (Array.isArray(rows) ? rows : []).entries()) {
    const p = rowSchema.safeParse(row);
    if (!p.success) { results.push({ row: i + 1, ok: false, reason: 'ساختار نامعتبر (ستون‌ها/طول)' }); continue; }
    const d = p.data;
    const std = await prisma.standard.findUnique({ where: { code: d.standardCode }, include: { chapters: true } });
    if (!std) { results.push({ row: i + 1, ok: false, reason: 'استاندارد یافت نشد' }); continue; }
    const ch = std.chapters.find(c => c.title.trim() === d.chapterTitle.trim());
    if (!ch) { results.push({ row: i + 1, ok: false, reason: 'فصل با این عنوان یافت نشد' }); continue; }
    if (d.options.some(o => FORBIDDEN.test(o))) { results.push({ row: i + 1, ok: false, reason: 'گزینه ممنوع (همه موارد/هیچ‌کدام/ترکیبی)' }); continue; }
    if (await prisma.question.findFirst({ where: { chapterId: ch.id, text: d.text } })) { results.push({ row: i + 1, ok: false, reason: 'سوال تکراری' }); continue; }
    await prisma.question.create({ data: { chapterId: ch.id, text: d.text, opt: d.options,
      correct: d.correct - 1, cognitive: d.cognitive ?? 'فهم', difficulty: d.difficulty ?? 'متوسط',
      source: d.source, aiGenerated: true, status: 'PENDING' } });
    results.push({ row: i + 1, ok: true });
  }
  await prisma.auditLog.create({ data: { actor: admin.email, action: 'QUESTION_IMPORT', entity: 'Question',
    meta: { total: results.length, ok: results.filter(r => r.ok).length } } });
  return NextResponse.json({ results, ok: results.filter(r => r.ok).length, rejected: results.filter(r => !r.ok).length });
}
