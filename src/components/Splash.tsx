'use client';
import { useEffect, useState } from 'react';

export default function Splash() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // فقط و فقط یک‌بار برای همیشه نمایش داده شود
    if (!localStorage.getItem('_splash_done')) {
      localStorage.setItem('_splash_done', '1');
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 2200);
      return () => clearTimeout(t);
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
