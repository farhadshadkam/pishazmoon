'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getToken } from '@/lib/client';

const MENU = [
  ['/admin', 'داشبورد'],
  ['/admin/standards', 'استانداردها'],
  ['/admin/bank', 'بانک سوالات'],
  ['/admin/gen', '🤖 تولید هوشمند'],
  ['/admin/evaluators', '👥 ارزیابان'],    // ← جدید
  ['/admin/discounts', '🎟 کدهای تخفیف'],  // ← جدید
  ['/admin/reports', 'گزارش آزمون‌ها'],
  ['/admin/finance', 'مدیریت مالی'],
  ['/admin/users', 'کاربران'],
  ['/admin/settings', 'تنظیمات'], 
];

export default function AdminShell({ children, title }: { children: React.ReactNode; title?: string }) {
  const path = usePathname();
  const router = useRouter();

  if (typeof window !== 'undefined' && !getToken(true) && path !== '/admin/login') {
    router.replace('/admin/login');
    return null;
  }

  return (
    <div className="grid md:grid-cols-[225px_1fr] gap-0 min-h-[70vh] mt-6" dir="rtl">
      <aside className="bg-[#141E4D] text-white p-4 flex md:flex-col gap-1 overflow-x-auto">
        <b className="hidden md:block px-3 pb-3">⚙️ پنل مدیریت</b>
        {MENU.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className={`block px-4 py-2.5 rounded-lg text-sm whitespace-nowrap ${
              path === href ? 'bg-white/15 text-white' : 'text-[#C9D2F2] hover:bg-white/10'
            }`}
          >
            {label}
          </Link>
        ))}
        <Link href="/" className="mt-2 block px-4 py-2.5 rounded-lg text-sm text-[#C9D2F2] hover:bg-white/10">
          ↩ بازگشت به سایت
        </Link>
        <button
          className="block w-full text-left px-4 py-2.5 rounded-lg text-sm text-rose-300 hover:bg-white/10"
          onClick={() => { localStorage.removeItem('PA_AD'); location.href = '/'; }}
        >
          خروج از پنل
        </button>
      </aside>
      <div className="p-4">
        {title && <h2 className="text-xl font-bold mb-4">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
