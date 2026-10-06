import './globals.css';

export const metadata = { title: 'پیش‌آزمون | خودت رو پیش از آزمون اصای محک بزن!' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet" />
        <link rel="icon" href="/logo.png" type="image/png" />
         {/* اسکریپت بررسی اسپلش — قبل از رندر بدنه اجرا می‌شود */}
         <script dangerouslySetInnerHTML={{ __html: `
           if (sessionStorage.getItem('_splash')) {
             document.documentElement.classList.add('no-splash');
           }
         ` }} />
      </head>
      <script dangerouslySetInnerHTML={{ __html: `
        (function() {
          var s = document.getElementById('splash');
          if (!s) return;
          if (sessionStorage.getItem('_splash')) {
            s.remove();
            return;
          }
          sessionStorage.setItem('_splash', '1');
          setTimeout(function() {
            if (s && s.parentNode) s.parentNode.removeChild(s);
          }, 2200);
        })();
      ` }} />
      <body>
         {/* اسپلش لوگو */}
         <div className="splash-overlay" id="splash">
            <img src="/logo.png" alt="پیش‌آزمون" />
            <span className="splash-text">پیش‌آزمون</span>
         </div>
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b" dir="rtl">
          <div className="max-w-[1140px] mx-auto flex items-center gap-4 py-2.5 px-4">
            <a href="/" className="flex items-center gap-2 font-extrabold text-lg text-[#141E4D]">
              <img src="/logo.png" alt="پیش‌آزمون" width="40" height="40" className="rounded-lg" />
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

        <main className="max-w-[1140px] mx-auto px-4 pb-16 min-h-[60vh]">
          {children}
        </main>

        <footer className="bg-[#141E4D] text-[#C9D2F2] mt-12 py-10 text-sm" dir="rtl">
          <div className="max-w-[1140px] mx-auto px-4">
            <div className="flex flex-wrap gap-8 justify-between items-start">
              <div>
                <p className="text-xs mb-3">© ۱۴۰۴ پیش‌آزمون — سرویس تمرینی مستقل</p>
                <div className="bg-white/10 rounded-lg p-3 text-xs max-w-md">
                  ⚠️ پیش‌آزمون یک سرویس تمرینی مستقل است؛ بازتولید آزمون رسمی سازمان آموزش فنی‌وحرفه‌ای کشور نیست.
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <a href="/standards" className="hover:text-white">فهرست استانداردها</a>
                <a href="/guide" className="hover:text-white">راهنمای استفاده</a>
                <a href="/legal" className="hover:text-white">قوانین و مقررات</a>
                <a href="/admin/login" className="text-[#8892C9] text-xs hover:text-white mt-3 pt-3 border-t border-white/10">⚙️ ورود مدیران</a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
