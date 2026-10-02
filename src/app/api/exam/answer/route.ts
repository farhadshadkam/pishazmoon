// answer
import { NextResponse } from 'next/server';
import { saveAnswer } from '@/lib/exam-engine';
import { verifyAttemptToken } from '@/lib/auth';
export async function POST(req: Request) {
  const b = await req.json();
  const t = await verifyAttemptToken(String(b.attemptToken ?? ''));
  if (!t) return NextResponse.json({ error: 'ATTEMPT_INVALID' }, { status: 401 });
  const r = await saveAnswer(t.attemptId, t.userId, String(b.qid), b.selected ?? null);
  return NextResponse.json(r, { status: r.error ? 400 : 200 });
}
