import { NextResponse } from 'next/server';
import { startAttempt } from '@/lib/exam-engine';
import { signAttemptToken } from '@/lib/auth';

export async function POST(req: Request) {
  const b = await req.json();
  const r = await startAttempt(String(b.code ?? ''), String(b.nationalId ?? ''), String(b.mobile ?? ''));
  if (r.error) return NextResponse.json({ error: r.error }, { status: 400 });
  const data = r as { attemptId: string; userId: string; startedAt: string; durationSec: number; [key: string]: any };
  const deadline = Date.parse(data.startedAt) + data.durationSec * 1000;
  return NextResponse.json({
    ...data,
    deadline: new Date(deadline).toISOString(),
    attemptToken: await signAttemptToken(data.attemptId, data.userId, deadline),
  });
}
