// ─── ارسال کد تأیید (OTP) — از طریق الگو ───
export async function sendOtp(mobile: string, code: string) {
  const key = process.env.KAVENEGAR_API_KEY;
  if (!key) {
    console.log(`[SMS-DEMO] OTP ${mobile}: ${code}`);
    return;
  }
  await fetch(
    `https://api.kavenegar.com/v1/${key}/verify/lookup.json?receptor=${mobile}&token=${code}&template=${process.env.KAVENEGAR_TEMPLATE || 'pishazmoon-otp'}`
  ).catch(() => {});
}

// ─── ارسال پیامک عادی (کد آزمون و ...) ───
export async function sendSms(mobile: string, message: string) {
  const key = process.env.KAVENEGAR_API_KEY;
  if (!key) {
    console.log(`[SMS-DEMO] ${mobile}: ${message}`);
    return;
  }
  await fetch(
    `https://api.kavenegar.com/v1/${key}/sms/send.json?receptor=${mobile}&message=${encodeURIComponent(message)}`
  ).catch(() => {});
}
