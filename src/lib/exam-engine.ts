import { prisma } from './db';

type PlanItem = { qid: string; chId: string; chTitle: string; w: number; order: number[] };
const shuffle = <T,>(arr: T[]): T[] => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export async function startAttempt(codeStr: string, nationalId: string, mobile: string) {
  const rec = await prisma.examCode.findUnique({ where: { code: codeStr.trim().toUpperCase() },
    include: { user: true, standard: { include: { chapters: { orderBy: { order: 'asc' } } } } } });
  if (!rec) return { error: 'CODE_NOT_FOUND' };
  if (rec.status === 'USED') return { error: 'CODE_USED' };
  if (rec.expiresAt < new Date()) { await prisma.examCode.update({ where: { id: rec.id }, data: { status: 'EXPIRED' } }); return { error: 'CODE_EXPIRED' }; }
  if (rec.user.nationalId !== nationalId.trim() || rec.user.mobile !== mobile.trim()) return { error: 'OWNER_MISMATCH' };

  // ادامه جلسه نیمه‌کاره (تا پایان زمان)
  const existing = await prisma.examAttempt.findFirst({ where: { codeId: rec.id, status: 'IN_PROGRESS' } });
  if (existing) {
    const plan = (existing.plan as PlanItem[]) ?? [];
    const answers = await prisma.examAnswer.findMany({ where: { attemptId: existing.id } });
    const qs = await prisma.question.findMany({ where: { id: { in: plan.map(x => x.qid) } } });
    return { attemptId: existing.id, userId: existing.userId, resumed: true, durationSec: existing.durationSec,
      startedAt: existing.startedAt.toISOString(),
      answers: Object.fromEntries(answers.map(a => [a.questionId, a.selected])),
      items: buildClientItems(plan, qs) };
  }

  // قاعده طلایی: هر فصل باید حداقل «وزنش» سوال انتشار‌یافته داشته باشد
  const chapters = rec.standard.chapters;
  for (const ch of chapters) {
    const cnt = await prisma.question.count({ where: { chapterId: ch.id, status: 'PUBLISHED' } });
    if (cnt < ch.weight) return { error: 'BANK_INCOMPLETE', standardTitle: rec.standard.title };
  }

  const plan: PlanItem[] = [];
  for (const ch of chapters) {
    const pool = await prisma.question.findMany({ where: { chapterId: ch.id, status: 'PUBLISHED' } });
    for (const q of shuffle(pool).slice(0, ch.weight))
      plan.push({ qid: q.id, chId: ch.id, chTitle: ch.title, w: ch.weight, order: shuffle([0, 1, 2, 3]) });
  }
  const attempt = await prisma.examAttempt.create({ data: {
    codeId: rec.id, userId: rec.userId, standardId: rec.standardId,
    durationSec: rec.standard.examMinutes * 60, plan } });
  const qs = await prisma.question.findMany({ where: { id: { in: plan.map(x => x.qid) } } });
  return { attemptId: attempt.id, userId: attempt.userId, resumed: false, durationSec: attempt.durationSec,
    startedAt: attempt.startedAt.toISOString(), answers: {}, items: buildClientItems(plan, qs) };
}

function buildClientItems(plan: PlanItem[], qs: { id: string; text: string; opt: string[] }[]) {
  const qMap = new Map(qs.map(q => [q.id, q]));
  return plan.map(it => ({ qid: it.qid, ch: it.chTitle, w: it.w, text: qMap.get(it.qid)!.text,
    options: it.order.map(i => qMap.get(it.qid)!.opt[i]) })); // ⚠️ پاسخ صحیح هرگز به کلاینت ارسال نمی‌شود
}

export async function saveAnswer(attemptId: string, userId: string, qid: string, selected: number | null) {
  const at = await prisma.examAttempt.findUnique({ where: { id: attemptId } });
  if (!at || at.userId !== userId) return { error: 'NOT_FOUND' };
  if (at.submittedAt) return { error: 'ALREADY_SUBMITTED' };
  if (Date.now() > at.startedAt.getTime() + at.durationSec * 1000) { await submitAttempt(attemptId, userId, true); return { error: 'TIME_OVER' }; }
  if (!(((at.plan as PlanItem[]) ?? []).some(x => x.qid === qid))) return { error: 'Q_NOT_IN_EXAM' };
  await prisma.examAnswer.upsert({ where: { attemptId_questionId: { attemptId, questionId: qid } },
    create: { attemptId, questionId: qid, selected }, update: { selected } });
  return { ok: true };
}

export async function submitAttempt(attemptId: string, userId: string, auto = false) {
  const at = await prisma.examAttempt.findUnique({ where: { id: attemptId } });
  if (!at || at.userId !== userId) return { error: 'NOT_FOUND' };
  if (at.submittedAt) return { attemptId, score: at.score, passed: at.passed, alreadySubmitted: true };
  if (!auto && Date.now() > at.startedAt.getTime() + at.durationSec * 1000) auto = true;

  const plan = (at.plan as PlanItem[]) ?? [];
  const answers = new Map((await prisma.examAnswer.findMany({ where: { attemptId } })).map(a => [a.questionId, a.selected]));
  const qs = new Map((await prisma.question.findMany({ where: { id: { in: plan.map(x => x.qid) } } })).map(q => [q.id, q]));

  let score = 0;
  const perChapter = new Map<string, { title: string; correct: number; weight: number }>();
  const byDiff: Record<string, [number, number]> = {}, byCog: Record<string, [number, number]> = {};
  const updates: Promise<unknown>[] = [];

  for (const it of plan) {
    const q = qs.get(it.qid)!;
    const sel = answers.get(it.qid) ?? null;
    const correctIdx = it.order.indexOf(q.correct); // جایگاه صحیح پس از به‌هم‌ریختگی گزینه‌ها
    const ok = sel !== null && sel === correctIdx;
    if (ok) score++;
    updates.push(prisma.examAnswer.upsert({ where: { attemptId_questionId: { attemptId, questionId: q.id } },
      create: { attemptId, questionId: q.id, selected: sel, isCorrect: ok }, update: { selected: sel, isCorrect: ok } }));
    const pc = perChapter.get(it.chId) ?? { title: it.chTitle, correct: 0, weight: it.w };
    if (ok) pc.correct++; perChapter.set(it.chId, pc);
    (byDiff[q.difficulty] ??= [0, 0])[1]++; if (ok) byDiff[q.difficulty][0]++;
    (byCog[q.cognitive] ??= [0, 0])[1]++;   if (ok) byCog[q.cognitive][0]++;
  }
  const std = await prisma.standard.findUnique({ where: { id: at.standardId } });
  const passed = score >= Math.round(40 * (std?.passPct ?? 70) / 100);
  await prisma.$transaction([...updates,
    prisma.examAttempt.update({ where: { id: attemptId }, data: { submittedAt: new Date(), autoSubmitted: auto,
      score, passed, perChapter: [...perChapter.values()], byDifficulty: byDiff, byCognitive: byCog, status: 'SUBMITTED' } }),
    prisma.examCode.update({ where: { id: at.codeId }, data: { status: 'USED', usedAt: new Date() } }),
  ]);
  return { attemptId, score, passed, total: 40, perChapter: [...perChapter.values()], byDifficulty: byDiff, byCognitive: byCog };
}
