// ─── لیست رسمی گروه‌های برنامه‌ریزی درسی سازمان آموزش فنی‌وحرفه‌ای ───
export const OFFICIAL_GROUPS = [
  'صنایع خودرو', 'الکترونیک', 'صنایع چوب', 'صنایع کاغذ',
  'جوشکاری و بازرسی جوش', 'حمل و نقل زمینی', 'حمل و نقل دریایی', 'حمل و نقل ریلی',
  'تاسیسات', 'صنایع دریایی', 'صنایع رنگ', 'صنایع شیمیایی',
  'پلیمر', 'پتروشیمی', 'صنایع چرم و پوست و خز', 'صنایع نساجی',
  'متالورژی', 'فناوری ارتباطات', 'مدیریت صنایع', 'سرامیک',
  'مکانیک', 'کنترل و ابزار دقیق', 'برق', 'صنایع فلزی',
  'ساختمان', 'معماری', 'صنعت چاپ', 'معدن',
  'امور اداری', 'امور مالی و بازرگانی', 'بهداشت و ایمنی', 'فناوری اطلاعات',
  'مراقبت و زیبایی', 'خدمات آموزشی', 'صنایع پوشاک', 'گردشگری',
  'هتلداری', 'امور شیلات و آبزی پروری', 'امور دام و ماکیان', 'امور باغی',
  'امور زراعی', 'زیست فناوری', 'فناوری محیط زیست', 'ماشین آلات کشاورزی',
  'صنایع غذایی', 'خدمات تغذیه ای', 'فرش',
  'صنایع دستی (چوب، فلز، سفال، چاپ، سنگ، شیشه، چرم)',
  'صنایع دستی (دوخت های سنتی)', 'طلا و جواهرسازی',
  'هنرهای تجسمی', 'هنرهای تزئینی', 'هنرهای نمایشی',
  'صنایع دستی(بافت)', 'فناوری نرم و فرهنگی', 'صنعت ورزش',
  'فناوری هوایی', 'فناوری نانو', 'گیاهان دارویی و داروهای گیاهی',
  'سلامت و طب ایرانی', 'فناوری انرژی های نو و تجدید پذیر',
  'مدیریت آب', 'منابع طبیعی (جنگل، مرتع، آبخیز و بیابان)',
  'صنایع بسته بندی', 'خدمات حقوقی', 'صنعت گاز',
];

// ─── نرمال‌سازی نام گروه ───
export function normalizeGroup(name: string): string {
  return name
    .replace(/[يى]/g, 'ی')        // ي عربی → ی فارسی
    .replace(/ك/g, 'ک')            // ك عربی → ک فارسی
    .replace(/\u200c/g, ' ')      // نیم‌فاصله → فاصله
    .replace(/\s+/g, ' ')         // فاصله تکراری → تک فاصله
    .replace(/و\s+/g, 'و ')      // "و نقل" → "و نقل" (استاندارد)
    .trim();
}

// ─── تطبیق فازی: نزدیک‌ترین گروه رسمی ───
export function matchGroup(aiGenerated: string): { matched: string; official: string; confidence: number } {
  const normalized = normalizeGroup(aiGenerated);

  // ۱. تطبیق دقیق
  const exact = OFFICIAL_GROUPS.find(g => normalizeGroup(g) === normalized);
  if (exact) return { matched: exact, official: exact, confidence: 100 };

  // ۲. شامل بودن (AI گروه رسمی را با کلمات اضافه نوشته)
  const contains = OFFICIAL_GROUPS.find(g => normalized.includes(normalizeGroup(g)));
  if (contains) return { matched: contains, official: contains, confidence: 90 };

  // ۳. شامل بودن معکوس (گروه رسمی شامل متن AI است)
  const containedBy = OFFICIAL_GROUPS.find(g => normalizeGroup(g).includes(normalized));
  if (containedBy) return { matched: containedBy, official: containedBy, confidence: 85 };

  // ۴. تشابه کلمات (بیش از ۵۰٪ کلمات مشترک)
  const words = normalized.split(' ').filter(w => w.length > 1);
  let best: { group: string; score: number } | null = null;

  for (const official of OFFICIAL_GROUPS) {
    const officialWords = normalizeGroup(official).split(' ').filter(w => w.length > 1);
    const common = words.filter(w => officialWords.some(ow => ow.includes(w) || w.includes(ow)));
    const score = Math.round((common.length / Math.max(words.length, officialWords.length)) * 100);
    if (score >= 50 && (!best || score > best.score)) {
      best = { group: official, score };
    }
  }

  if (best) return { matched: best.group, official: best.group, confidence: best.score };

  // ۵. عدم تطبیق
  return { matched: aiGenerated, official: '', confidence: 0 };
}
