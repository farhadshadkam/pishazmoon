import { SignJWT, jwtVerify } from 'jose';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { prisma } from './db';

const S = new TextEncoder().encode(process.env.JWT_SECRET!);
const SA = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET!);

export function hashPassword(pw: string) {
  const salt = randomBytes(16).toString('hex');
  return salt + ':' + scryptSync(pw, salt, 64).toString('hex');
}
export function verifyPassword(pw: string, stored: string) {
  const [salt, hash] = stored.split(':');
  const h = scryptSync(pw, salt, 64);
  return timingSafeEqual(h, Buffer.from(hash, 'hex'));
}

export const signUserToken   = (id: string) => new SignJWT({ sub: id, typ: 'user' }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('30d').sign(S);
export const signAdminToken  = (id: string) => new SignJWT({ sub: id, typ: 'admin' }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('12h').sign(SA);
export const signAttemptToken = (id: string, uid: string, deadlineMs: number) =>
  new SignJWT({ sub: id, uid, typ: 'attempt' }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime(Math.floor(deadlineMs / 1000)).sign(S);

export async function requireUser(req: Request) {
  try {
    const { payload } = await jwtVerify(req.headers.get('authorization')?.replace('Bearer ', '') ?? '', S);
    if (payload.typ !== 'user') return null;
    return prisma.user.findUnique({ where: { id: payload.sub as string } });
  } catch { return null }
}
export async function requireAdmin(req: Request) {
  try {
    const { payload } = await jwtVerify(req.headers.get('authorization')?.replace('Bearer ', '') ?? '', SA);
    if (payload.typ !== 'admin') return null;
    return prisma.adminUser.findUnique({ where: { id: payload.sub as string } });
  } catch { return null }
}
export async function verifyAttemptToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, S);
    return payload.typ === 'attempt' ? { attemptId: payload.sub as string, userId: payload.uid as string } : null;
  } catch { return null }
}

// — OTP: حداکثر ۳ کد در ۱۰ دقیقه، انقضای ۲ دقیقه، حداکثر ۵ تلاش —
export async function issueOtp(mobile: string) {
  const recent = await prisma.otpCode.count({ where: { mobile, createdAt: { gt: new Date(Date.now() - 10 * 60_000) } } });
  if (recent >= 3) return { error: 'OTP_RATE_LIMIT' as const };
  const code = String(Math.floor(10000 + Math.random() * 90000));
  await prisma.otpCode.create({ data: { mobile, code, expiresAt: new Date(Date.now() + 2 * 60_000) } });
  return { code };
}
export async function consumeOtp(mobile: string, code: string) {
  const otp = await prisma.otpCode.findFirst({ where: { mobile, usedAt: null }, orderBy: { createdAt: 'desc' } });
  if (!otp || otp.tries >= 5 || otp.expiresAt < new Date()) return false;
  if (otp.code !== code) { await prisma.otpCode.update({ where: { id: otp.id }, data: { tries: otp.tries + 1 } }); return false }
  await prisma.otpCode.update({ where: { id: otp.id }, data: { usedAt: new Date() } });
  return true;
}
