import './globals.css';

export const metadata = { title: 'پیش‌آزمون | محک خودت پیش از آزمون اصلی' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet" />
      </head>
      <body>
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b" dir="rtl">
          <div className="max-w-[1140px] mx-auto flex items-center gap-4 py-2.5 px-4">
            <a href="/" className="flex items-center gap-2 font-extrabold text-lg text-[#141E4D]">
              <svg width="34" height="34" viewBox="0 0 24 24"><polygon points="12,1.5 21.5,7 21.5,17 12,22.5 2.5,17 2.5,7" fill="#1D2E7A"/><text x="12" y="16" text-anchor="middle" fill="#fff" font-size="11" font-weight="800">پ</text></svg>
              پیش‌آزمون
            </a>
            <nav className="hidden md:flex gap-4 mr-auto items-center">
              <a href="/standards" className="font-medium py-1.5 hover:text-[#2E4BD1]">استانداردها</a>
              <a href="/guide" className="font-medium py-1.5 hover:text-[#2E4BD1]">راهنما</a>
              <a href="/about" className="font-medium py-1.5 hover:text-[#2E4BD1]">درباره</a>
              <a href="/auth" className="btn-p btn-sm">ورود / ثبت‌نام</a>
            </nav>
          </div>
        </header>
        <main className="max-w-[1140px] mx-auto px-4 pb-16 min-h-[60vh]">{children}</main>
        <footer className="bg-[#141E4D] text-[#C9D2F2] mt-12 py-10 text-sm" dir="rtl">
          <div className="max-w-[1140px] mx-auto px-4">
            <p className="text-xs">© ۱۴۰۴ پیش‌آزمون</p>
            <div className="mt-3 bg-white/10 rounded-lg p-2 text-xs">⚠️ پیش‌آزمون یک سرویس تمرینی مستقل است؛ بازتولید آزمون رسمی سازمان آموزش فنی‌وحرفه‌ای کشور نیست.</div>
          </div>
        <footer className="bg-[#141E4D] text-[#C9D2F2] mt-12 py-10 text-sm" dir="rtl">
          <div className="max-w-[1140px] mx-auto px-4">
            <div className="flex flex-wrap gap-6 justify-between items-start">
              <div>
                <p className="text-xs">© ۱۴۰۴ پیش‌آزمون — سرویس تمرینی مستقل</p>
                <div className="mt-3 bg-white/10 rounded-lg p-2 text-xs">⚠️ پیش‌آزمون بازتولید آزمون رسمی سازمان آموزش فنی‌وحرفه‌ای کشور نیست.</div>
              </div>
              <div className="flex flex-col gap-2 text-sm">
                <a href="/standards" className="hover:text-white">فهرست استانداردها</a>
                <a href="/guide" className="hover:text-white">راهنمای استفاده</a>
                <a href="/legal" className="hover:text-white">قوانین و مقررات</a>
                <a href="/admin/login" className="text-[#8892C9] text-xs hover:text-white mt-2">⚙️ ورود مدیران</a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
