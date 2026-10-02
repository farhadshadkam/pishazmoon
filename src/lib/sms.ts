// sms.ts
export async function sendSms(mobile: string, message: string) {
  const key = process.env.KAVENEGAR_API_KEY;
  if (!key) { console.log(`[SMS-DEMO] ${mobile}: ${message}`); return; }
  await fetch(`https://api.kavenegar.com/v1/${key}/sms/send.json?receptor=${mobile}&message=${encodeURIComponent(message)}`).catch(() => {});
}
