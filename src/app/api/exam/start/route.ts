import { NextResponse } from 'next/server';
import { startAttempt } from '@/lib/exam-engine';
import { signAttemptToken } from '@/lib/auth';

export async function POST(req: Request) {
  const b = await req.json();
  const r = await startAttempt(String(b.code ?? ''), String(b.nationalId ?? ''), String(b.mobile ?? ''));
  if (r.error) return NextResponse.json({ error: r.error, standardTitle: (r as any).standardTitle }, { status: 400 });
  const deadline = Date.parse(r.startedAt) + r.durationSec * 1000;
  return NextResponse.json({ ...r, deadline: new Date(deadline).toISOString(),
    attemptToken: await signAttemptToken(r.attemptId, r.userId, deadline) });
}
