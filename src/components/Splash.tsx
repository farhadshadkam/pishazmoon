'use client';
import { useEffect, useState } from 'react';

export default function Splash() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // فقط اگر قبلاً در این نشست نمایش داده نشده باشد
    if (!sessionStorage.getItem('_splash')) {
      sessionStorage.setItem('_splash', '1');
      setVisible(true);
      // مخفی‌سازی بعد از انیمیشن
      const timer = setTimeout(() => setVisible(false), 2200);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="splash-overlay">
      <img src="/logo.png" alt="پیش‌آزمون" />
      <span className="splash-text">پیش‌آزمون</span>
    </div>
  );
}
