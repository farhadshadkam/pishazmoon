import { z } from 'zod';

export function isValidNationalId(id: string): boolean {
  if (!/^\d{10}$/.test(id) || /^(\d)\1{9}$/.test(id)) return false;
  let s = 0; for (let i = 0; i < 9; i++) s += Number(id[i]) * (10 - i);
  const r = s % 11, c = Number(id[9]);
  return r < 2 ? c === r : c === 11 - r;
}
export const mobileSchema    = z.string().regex(/^09\d{9}$/, 'موبایل نامعتبر');
export const nationalIdSchema = z.string().refine(isValidNationalId, 'کد ملی نامعتبر');
export const registerSchema = z.object({
  firstName: z.string().min(2), lastName: z.string().min(2),
  birthYear: z.number().int().min(1300).max(1395),
  county: z.string().min(2),
  nationalId: nationalIdSchema, mobile: mobileSchema,
});
