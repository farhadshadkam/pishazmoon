'use client';
import AdminShell from '@/components/AdminShell';
import { get, post } from '@/lib/client';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const [s, setS] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    get('/admin/settings', true).then((d: any) => {
      const m: Record<string, string> = {};
      if (Array.isArray(d)) d.forEach((x: any) => { m[x.key] = x.value; });
      setS(m);
    });
  }, []);

  const save = async () => {
    setSaving(true); setSaved(false);
    const entries = Object.entries(s).map(([key, value]) => ({ key, value }));
    const r = await post('/admin/settings', entries, true);
    setSaving(false);
    if (r.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    else alert('خطا در ذخیره');
  };

  const F = (k: string, l: string, ph?: string, multiline?: boolean) => (
    <div className="mb-3">
      <label className="text-sm font-bold block mb-1">{l}</label>
      {multiline ? (
        <textarea className="inp" rows={2} placeholder={ph} value={s[k] || ''} onChange={(e) => setS({ ...s, [k]: e.target.value })} />
      ) : (
        <input className="inp" placeholder={ph} value={s[k] || ''} onChange={(e) => setS({ ...s, [k]: e.target.value })} />
      )}
    </div>
  );

  const Card = ({ title, icon, children }: any) => (
    <div className="card">
      <h3 className="font-bold mb-3">{icon} {title}</h3>
      {children}
    </div>
  );

  return (
    <AdminShell title="⚙️ تنظیمات سامانه">
      <div dir="rtl" className="grid md:grid-cols-2 gap-4 items-start">

        <Card title="تنظیمات آزمون" icon="🎯">
          {F('examMin', 'مدت آزمون (دقیقه)', '60')}
          {F('passPct', 'حد نصاب قبولی (٪)', '70')}
        </Card>

        <Card title="پیام‌رسان بله" icon="🤖">
          {F('baleLink', 'لینک ربات بله', 'https://ble.ir/yourbot')}
          {F('baleToken', 'توکن ربات (از BotFather)', '123456:ABC-xyz...')}
          <p className="text-xs text-slate-400">💡 توکن را از @BotFather بله دریافت کنید</p>
        </Card>

        <Card title="💳 درگاه پرداخت الکترونیکی" icon="💳">
          <div className="mb-3">
            <label className="text-sm font-bold block mb-1">درگاه پیش‌فرض</label>
            <select className="inp" value={s['paymentGateway'] || 'zarinpal'} onChange={(e) => setS({ ...s, paymentGateway: e.target.value })}>
              <option value="zarinpal">زرین‌پال</option>
              <option value="seppal">سپال</option>
              <option value="idpay">آیدی‌پی</option>
            </select>
          </div>
          {F('zarinpalMerchant', 'مرچنت‌کد زرین‌پال', 'xxxxxxxx-xxxx-xxxx-xxxx')}
          {F('seppalToken', 'توکن سپال (در صورت استفاده)', '')}
          {F('idpayApiKey', 'کلید آیدی‌پی (در صورت استفاده)', '')}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700 mt-3">
            <b>فعال‌سازی پرداخت واقعی:</b>
            <ol className="mt-1 list-decimal list-inside space-y-1">
              <li>در zarinpal.com ثبت‌نام و درگاه بسازید</li>
              <li>مرچنت‌کد را اینجا وارد و ذخیره کنید</li>
              <li>در لیارا: ZARINPAL_SANDBOX=false</li>
              <li>استقرار مجدد کنید</li>
            </ol>
          </div>
        </Card>

        <Card title="📱 سرویس پیامک" icon="📱">
          <div className="mb-3">
            <label className="text-sm font-bold block mb-1">سرویس‌دهنده</label>
            <select className="inp" value={s['smsProvider'] || 'kavenegar'} onChange={(e) => setS({ ...s, smsProvider: e.target.value })}>
              <option value="kavenegar">کاوه‌نگار</option>
              <option value="smsir">SMS.ir</option>
            </select>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 mb-3">
            <b>⚠️ کلید API پیامک از امنیت بالایی برخوردار است.</b>
            <p className="mt-1">برای امنیت، کلید API را در <b>متغیرهای محیطی لیارا</b> وارد کنید:</p>
            <code className="block mt-1 bg-white rounded px-2 py-1">KAVENEGAR_API_KEY=کلید شما</code>
            <p className="mt-1">کنسول لیارا ← اپ ← تنظیمات ← متغیرهای محیطی</p>
          </div>
          {F('smsSenderNumber', 'شماره ارسال‌کننده (اختیاری)', '10004346')}
        </Card>

        <Card title="متن‌های پیامک" icon="✉️">
          {F('smsOtp', 'کد تأیید ثبت‌نام', 'پیش‌آزمون | کد تأیید: {code}', true)}
          {F('smsCode', 'ارسال کد آزمون', 'پیش‌آزمون | کد آزمون: {code}', true)}
          {F('smsRemind', 'یادآوری انقضا', 'کد آزمون {std} تا {days} روز دیگر منقضی می‌شود.', true)}
        </Card>

        <Card title="🔗 سایر تنظیمات" icon="🔗">
          {F('siteName', 'نام سایت', 'پیش‌آزمون')}
          {F('supportPhone', 'تلفن پشتیبانی', '021-...')}
          {F('supportEmail', 'ایمیل پشتیبانی', 'support@pishazmoon.ir')}
        </Card>
      </div>

      <button className="btn-p w-full mt-6 !py-4 font-bold" onClick={save} disabled={saving}>
        {saving ? '⏳ در حال ذخیره...' : saved ? '✅ ذخیره شد!' : '💾 ذخیره همه تنظیمات'}
      </button>
    </AdminShell>
  );
}
