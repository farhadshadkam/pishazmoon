'use client';
import { useState } from 'react';

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
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

        <button
          className="md:hidden mr-auto text-xl px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
          onClick={() => setOpen(!open)}
        >☰</button>
      </div>

      {open && (
        <div className="md:hidden border-t bg-white" dir="rtl">
          <div className="flex flex-col px-4 py-3 gap-2">
            <a href="/standards" className="py-2 text-sm font-medium border-b border-dashed border-slate-200" onClick={() => setOpen(false)}>استانداردها</a>
            <a href="/guide" className="py-2 text-sm font-medium border-b border-dashed border-slate-200" onClick={() => setOpen(false)}>راهنما</a>
            <a href="/about" className="py-2 text-sm font-medium border-b border-dashed border-slate-200" onClick={() => setOpen(false)}>درباره</a>
            <a href="/auth" className="btn-p btn-sm mt-2 text-center" onClick={() => setOpen(false)}>ورود / ثبت‌نام</a>
          </div>
        </div>
      )}
    </header>
  );
}
