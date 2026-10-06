import './globals.css';
import SiteHeader from '@/components/SiteHeader';

export const metadata = {
  title: 'پیش‌آزمون | قبل از آزمون اصلی خودت رو محک بزن',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet" />
        <link rel="icon" href="/logo.png" type="image/png" />
      </head>
      <body>
        {/* هدر — کامپوننت Client جداگانه */}
        <SiteHeader />

        <main className="max-w-[1140px] mx-auto px-4 pb-16 min-h-[60vh]">
          {children}
        </main>

        <footer className="bg-[#141E4D] text-[#C9D2F2] mt-12 py-10 text-sm" dir="rtl">
          <div className="max-w-[1140px] mx-auto px-4">
            <div className="flex flex-wrap gap-8 justify-between items-start">
              <div className="flex-1 min-w-[250px]">
                <div className="flex items-center gap-2 mb-3">
                  <img src="/logo.png" alt="پیش‌آزمون" width="32" height="32" className="rounded-lg" />
                  <b className="text-white">پیش‌آزمون</b>
                </div>
                <p className="text-xs text-[#8892C9]">سامانه پیش‌آزمون‌های تمرینی مبتنی بر استانداردهای شایستگی مهارتی</p>
                <div className="mt-3 bg-white/10 rounded-lg p-3 text-xs max-w-md">
                  ⚠️ پیش‌آزمون یک سرویس تمرینی مستقل است؛ بازتولید آزمون رسمی سازمان آموزش فنی‌وحرفه‌ای کشور نیست.
                </div>
              </div>
              <div className="flex flex-col gap-2 text-sm">
                <b className="text-white text-xs mb-1">دسترسی سریع</b>
                <a href="/standards" className="hover:text-white">فهرست استانداردها</a>
                <a href="/guide" className="hover:text-white">راهنمای استفاده</a>
                <a href="/legal" className="hover:text-white">قوانین و مقررات</a>
                <a href="/admin/login" className="text-[#8892C9] text-xs hover:text-white mt-3 pt-3 border-t border-white/10">⚙️ ورود مدیران</a>
              </div>
            </div>
            <div className="mt-8 pt-4 border-t border-white/10 text-center text-xs text-[#8892C9]">
              © ۱۴۰۴ پیش‌آزمون
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
