'use client';

import { useEffect, useState, type ChangeEvent, type ReactNode } from 'react';
import Link from 'next/link';

/* ============================================================
   نقاط اتصال به API
   اگر مسیر هر یک از این routeها در پروژه شما متفاوت است،
   فقط همین چند خط را ویرایش کنید؛ بقیه فایل دست‌نخورده بماند.
   ============================================================ */
const API = {
  // GET  : لیست استانداردها به همراه فصل‌ها
  // POST : ثبت استاندارد جدید (با یا بدون سوالات تو در تو)
  standards: '/api/admin/standards',
  // POST : ورود سوالات به یک فصل موجود  { chapterId, questions }
  importQuestions: '/api/admin/questions/import',
  // POST : تولید سوال با هوش مصنوعی  { chapterId, count, focus? }
  aiGenerate: '/api/admin/ai-generate',
};

/* ---------- انواع داده ---------- */
interface ChapterRow {
  id: number;
  title: string;
  weight: number;
  bankRequired: number;
  questionCount: number | null;
}
interface StdRow {
  id: number;
  code: string;
  title: string;
  groupName: string;
  profession: string;
  job: string;
  hours: number;
  chapters: ChapterRow[];
}
interface GenQuestion {
  id: number;
  text: string;
  options: string[];
  correct: number;
  cognitive: string;
  difficulty: string;
  source: string;
  score: number | null;
  verdict: string;
}
interface MsgState {
  kind: 'ok' | 'err';
  text: string;
}
interface WizardChapter {
  title: string;
  weight: number;
}
interface JsonPreview {
  errors: string[];
  warns: string[];
  summary: string;
  questionsTotal: number;
  payload: Record<string, unknown> | null;
  questions: Record<string, unknown>[];
}
type FieldEvent = ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

/* ---------- ابزارهای کمکی ---------- */
const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

function fa(v: number | string): string {
  return String(v).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

function str(v: unknown, fb = ''): string {
  return typeof v === 'string' ? v : fb;
}

function num(v: unknown, fb = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fb;
}

function pickList(v: unknown): Record<string, unknown>[] {
  if (Array.isArray(v)) {
    return v.filter((x) => !!x && typeof x === 'object') as Record<string, unknown>[];
  }
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    for (const k of ['standards', 'questions', 'chapters', 'items', 'data', 'results', 'generated']) {
      const inner = o[k];
      if (Array.isArray(inner)) {
        return inner.filter((x) => !!x && typeof x === 'object') as Record<string, unknown>[];
      }
    }
  }
  return [];
}

/* آرایه گزینه‌ها: هم رشته ساده و هم شیء دارای text/label را پشتیبانی می‌کند */
function pickOptions(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => {
    if (typeof x === 'string') return x.trim();
    if (x && typeof x === 'object') {
      const ox = x as Record<string, unknown>;
      return str(ox.text ?? ox.label).trim();
    }
    return '';
  });
}

function getAdminToken(): string {
  if (typeof window === 'undefined') return '';
  return (
    window.localStorage.getItem('admin_token') ||
    window.localStorage.getItem('adminToken') ||
    window.localStorage.getItem('token') ||
    ''
  );
}

async function apiFetch(
  path: string,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  try {
    const token = getAdminToken();
    const res = await fetch(path, {
      cache: 'no-store',
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
    });
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    const wrapped =
      data && typeof data === 'object' && !Array.isArray(data)
        ? (data as Record<string, unknown>)
        : { items: data ?? [] };
    return { ok: res.ok, status: res.status, data: wrapped };
  } catch {
    return {
      ok: false,
      status: 0,
      data: { error: 'ارتباط با سرور برقرار نشد؛ اتصال را بررسی کنید و دوباره تلاش کنید.' },
    };
  }
}

/* ---------- نگاشت پاسخ API به مدل داخلی ---------- */
function mapStd(o: Record<string, unknown>): StdRow {
  const chapters = pickList(o.chapters).map((c) => {
    const weight = num(c.weight, 0);
    let cntRaw: unknown = c.questionCount;
    if (cntRaw === undefined || cntRaw === null) {
      const cc = c._count;
      if (typeof cc === 'number') cntRaw = cc;
      else if (cc && typeof cc === 'object') cntRaw = (cc as Record<string, unknown>).questions;
    }
    return {
      id: num(c.id),
      title: str(c.title),
      weight,
      bankRequired: num(c.bankRequired, weight * 10),
      questionCount: typeof cntRaw === 'number' ? cntRaw : null,
    };
  });
  return {
    id: num(o.id),
    code: str(o.code),
    title: str(o.title ?? o.name),
    groupName: str(o.groupName ?? o.group),
    profession: str(o.profession),
    job: str(o.job),
    hours: num(o.hours, 0),
    chapters,
  };
}

function mapGenQuestion(o: Record<string, unknown>): GenQuestion {
  const options = pickOptions(o.options ?? o.choices);
  const v =
    o.validation && typeof o.validation === 'object' && !Array.isArray(o.validation)
      ? (o.validation as Record<string, unknown>)
      : null;
  const score =
    typeof o.score === 'number'
      ? o.score
      : v && typeof v.score === 'number'
        ? v.score
        : typeof o.aiScore === 'number'
          ? o.aiScore
          : null;
  const verdict = str(o.verdict ?? (v ? v.verdict : ''));
  return {
    id: num(o.id),
    text: str(o.text ?? o.stem ?? o.question),
    options,
    correct: num(o.correct ?? o.answer ?? o.answerIndex, -1),
    cognitive: str(o.cognitive),
    difficulty: str(o.difficulty),
    source: str(o.source),
    score,
    verdict,
  };
}

function chapterLabel(c: ChapterRow): string {
  const parts = [c.title || 'فصل بدون عنوان', 'وزن ' + fa(c.weight), 'بانک: ' + fa(c.bankRequired)];
  if (c.questionCount !== null) parts.push('موجود: ' + fa(c.questionCount));
  return parts.join(' — ');
}

/* ---------- نرمال‌سازی و اعتبارسنجی JSON ورودی ---------- */
const DIFF_MAP: Record<string, string> = {
  'آسان': 'آسان',
  easy: 'آسان',
  'متوسط': 'متوسط',
  medium: 'متوسط',
  normal: 'متوسط',
  'دشوار': 'دشوار',
  'سخت': 'دشوار',
  hard: 'دشوار',
  difficult: 'دشوار',
};

const COG_MAP: Record<string, string> = {
  'یادآوری': 'یادآوری',
  recall: 'یادآوری',
  'دانش': 'یادآوری',
  'فهم': 'فهم',
  'درک و فهم': 'فهم',
  'درک': 'فهم',
  understanding: 'فهم',
  comprehension: 'فهم',
  'کاربرد': 'کاربرد',
  application: 'کاربرد',
  'تحلیل': 'تحلیل',
  analysis: 'تحلیل',
  'ارزیابی': 'ارزیابی',
  'ارزشیابی': 'ارزیابی',
  evaluation: 'ارزیابی',
};

function mapEnum(v: unknown, map: Record<string, string>): string {
  const s = str(v).trim();
  if (!s) return '';
  return map[s] ?? map[s.toLowerCase()] ?? s;
}

function normalizeQuestion(o: Record<string, unknown>): { q: Record<string, unknown> | null; error: string } {
  const text = str(o.text ?? o.stem ?? o.question ?? o.questionText).trim();
  if (!text) {
    return { q: null, error: 'متن سوال خالی است.' };
  }
  const options = pickOptions(o.options ?? o.choices);
  if (options.length !== 4 || options.some((s) => !s)) {
    return { q: null, error: 'گزینه‌ها باید دقیقاً ۴ مورد غیرخالی باشند.' };
  }
  let correct = num(o.correct, -1);
  if (correct < 0) {
    correct = num(o.answer ?? o.answerIndex ?? o.correctIndex, -1);
  }
  if (correct < 0 || correct >= options.length) {
    return { q: null, error: 'شماره گزینه صحیح (correct) نامعتبر است.' };
  }
  const q: Record<string, unknown> = {
    text,
    options,
    correct,
    difficulty: mapEnum(o.difficulty, DIFF_MAP) || 'متوسط',
    cognitive: mapEnum(o.cognitive, COG_MAP) || 'فهم',
    source: str(o.source).trim(),
  };
  return { q, error: '' };
}

/* پارسر بخشنده: چند بلوک JSON که پشت‌سرهم (بدون کاما) چسبیده‌اند را جدا و پارس می‌کند */
function parseLooseJson(text: string): { values: unknown[]; error: string } {
  const trimmed = text.trim();
  if (!trimmed) return { values: [], error: '' };
  const values: unknown[] = [];
  try {
    values.push(JSON.parse(trimmed));
    return { values, error: '' };
  } catch {
    /* اگر کل متن یک JSON نبود، اسکن بخش‌بخش انجام می‌شود */
  }
  let depth = 0;
  let start = -1;
  let inStr = false;
  let esc = false;
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') {
      inStr = true;
      continue;
    }
    if (ch === '{' || ch === '[') {
      if (depth === 0) start = i;
      depth += 1;
      continue;
    }
    if (ch === '}' || ch === ']') {
      if (depth > 0) {
        depth -= 1;
        if (depth === 0 && start >= 0) {
          const chunk = trimmed.slice(start, i + 1);
          try {
            values.push(JSON.parse(chunk));
          } catch {
            return { values, error: 'یکی از بلوک‌های JSON نامعتبر است (نزدیک کاراکتر ' + fa(i) + ').' };
          }
          start = -1;
        }
      }
      continue;
    }
  }
  if (depth !== 0) {
    return { values, error: 'ساختار JSON ناقص است (براکت بسته‌نشده باقی مانده).' };
  }
  if (values.length === 0) {
    return { values: [], error: 'هیچ بلوک JSON معتبری پیدا نشد.' };
  }
  return { values, error: '' };
}

function normalizeStandardBlocks(values: unknown[]): JsonPreview {
  const errors: string[] = [];
  const warns: string[] = [];
  const rawChapters: Record<string, unknown>[] = [];
  let meta: Record<string, unknown> | null = null;
  for (const v of values) {
    if (Array.isArray(v)) {
      for (const item of v) {
        if (
          item &&
          typeof item === 'object' &&
          !Array.isArray(item) &&
          Array.isArray((item as Record<string, unknown>).questions)
        ) {
          rawChapters.push(item as Record<string, unknown>);
        }
      }
      continue;
    }
    if (!v || typeof v !== 'object') {
      warns.push('یک بلوک غیرشیء در JSON نادیده گرفته شد.');
      continue;
    }
    let o = v as Record<string, unknown>;
    const stdWrapper = o['standard'];
    if (stdWrapper && typeof stdWrapper === 'object' && !Array.isArray(stdWrapper)) {
      o = stdWrapper as Record<string, unknown>;
    }
    const bCode = str(o['code']).trim();
    if (Array.isArray(o['chapters'])) {
      if (!meta) {
        meta = o;
        for (const c of pickList(o['chapters'])) rawChapters.push(c);
      } else if (bCode && str(meta['code']).trim() && bCode !== str(meta['code']).trim()) {
        warns.push('بلوکی با کد استاندارد متفاوت (' + bCode + ') نادیده گرفته شد.');
      } else {
        if (bCode && !str(meta['code']).trim()) meta = o;
        for (const c of pickList(o['chapters'])) rawChapters.push(c);
      }
    } else if (Array.isArray(o['questions'])) {
      rawChapters.push(o);
    } else if (str(o['title']).trim() && typeof o['weight'] === 'number') {
      rawChapters.push(o);
    } else {
      warns.push('یک بلوک JSON نه استاندارد بود و نه فصل؛ نادیده گرفته شد.');
    }
  }
  if (!meta) {
    errors.push('هیچ بلوکی شامل اطلاعات استاندارد (کلیدهای code و title) پیدا نشد.');
    return { errors, warns, summary: '', questionsTotal: 0, payload: null, questions: [] };
  }
  const code = str(meta['code']).trim();
  const title = str(meta['title']).trim();
  if (!code) errors.push('کلید code (کد استاندارد) در بلوک اصلی پیدا نشد.');
  if (!title) errors.push('کلید title (عنوان استاندارد) در بلوک اصلی پیدا نشد.');
  if (rawChapters.length === 0) errors.push('هیچ فصلی (chapters) پیدا نشد.');
  let totalQ = 0;
  let totalW = 0;
  const chapters: Record<string, unknown>[] = rawChapters.map((c, ci) => {
    const cTitle = str(c['title']).trim();
    const weight = num(c['weight'], 0);
    totalW += weight;
    const rawQs = pickList(c['questions']);
    const questions: Record<string, unknown>[] = [];
    rawQs.forEach((qo, qi) => {
      const res = normalizeQuestion(qo);
      if (res.q) {
        questions.push(res.q);
      } else {
        errors.push('فصل ' + fa(ci + 1) + ' — سوال ' + fa(qi + 1) + ': ' + res.error);
      }
    });
    totalQ += questions.length;
    if (!cTitle) warns.push('فصل شماره ' + fa(ci + 1) + ' عنوان ندارد.');
    return { title: cTitle, weight, bankRequired: weight * 10, questions };
  });
  if (rawChapters.length > 0 && totalW !== 40) {
    warns.push('مجموع وزن فصل‌ها ' + fa(totalW) + ' است؛ برای آزمون ۴۰ سوالی باید دقیقاً ۴۰ شود.');
  }
  const seen = new Set<string>();
  let dups = 0;
  chapters.forEach((c) => {
    const qs = (c.questions as Record<string, unknown>[]) || [];
    qs.forEach((q) => {
      const t = String(q.text).replace(/\s+/g, ' ').trim().slice(0, 60);
      if (seen.has(t)) dups += 1;
      else seen.add(t);
    });
  });
  if (dups > 0) warns.push(fa(dups) + ' سوال تکراری داخل همین فایل پیدا شد.');
  const payload: Record<string, unknown> | null =
    errors.length === 0
      ? {
          code,
          title,
          groupName: str(meta['groupName'] ?? meta['group']).trim(),
          profession: str(meta['profession']).trim(),
          job: str(meta['job']).trim(),
          hours: num(meta['hours'], 0),
          description: str(meta['description']).trim(),
          chapters,
        }
      : null;
  return {
    errors,
    warns,
    summary: chapters.length > 0 ? fa(chapters.length) + ' فصل — ' + fa(totalQ) + ' سوال' : '',
    questionsTotal: totalQ,
    payload,
    questions: [],
  };
}

function validateQuestionsLoose(
  values: unknown[]
): { errors: string[]; warns: string[]; summary: string; questions: Record<string, unknown>[] } {
  const list: unknown[] = [];
  for (const v of values) {
    if (Array.isArray(v)) {
      for (const item of v) {
        if (item && typeof item === 'object' && Array.isArray((item as Record<string, unknown>).questions)) {
          for (const q of (item as Record<string, unknown>).questions as unknown[]) list.push(q);
        } else {
          list.push(item);
        }
      }
    } else if (v && typeof v === 'object' && Array.isArray((v as Record<string, unknown>).questions)) {
      for (const q of (v as Record<string, unknown>).questions as unknown[]) list.push(q);
    } else if (v && typeof v === 'object') {
      list.push(v);
    }
  }
  return validateQuestionsPayload(list);
}

function validateQuestionsPayload(
  raw: unknown
): { errors: string[]; warns: string[]; summary: string; questions: Record<string, unknown>[] } {
  const errors: string[] = [];
  const warns: string[] = [];
  let list: unknown[] = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (raw && typeof raw === 'object' && Array.isArray((raw as Record<string, unknown>).questions)) {
    list = (raw as Record<string, unknown>).questions as unknown[];
  } else {
    errors.push('JSON باید آرایه‌ای از سوالات یا شیئی با کلید questions باشد.');
    return { errors, warns, summary: '', questions: [] };
  }
  if (list.length === 0) errors.push('هیچ سوالی در JSON پیدا نشد.');
  const questions: Record<string, unknown>[] = [];
  list.forEach((qo, qi) => {
    if (!qo || typeof qo !== 'object' || Array.isArray(qo)) {
      errors.push('سوال ' + fa(qi + 1) + ': ساختار نامعتبر است.');
      return;
    }
    const res = normalizeQuestion(qo as Record<string, unknown>);
    if (res.q) {
      questions.push(res.q);
    } else {
      errors.push('سوال ' + fa(qi + 1) + ': ' + res.error);
    }
  });
  const seen = new Set<string>();
  let dups = 0;
  questions.forEach((q) => {
    const t = String(q.text).replace(/\s+/g, ' ').trim().slice(0, 60);
    if (seen.has(t)) dups += 1;
    else seen.add(t);
  });
  if (dups > 0) warns.push(fa(dups) + ' سوال تکراری داخل همین فایل پیدا شد.');
  return { errors, warns, summary: fa(questions.length) + ' سوال معتبر برای ورود', questions };
}

/* ---------- اجزای کوچک رابط کاربری ---------- */
const TONES = {
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
} as const;
type Tone = keyof typeof TONES;

function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={'inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-semibold ' + TONES[tone]}>
      {children}
    </span>
  );
}

function Msg({ kind, children }: { kind: 'ok' | 'err'; children: ReactNode }) {
  const cls =
    kind === 'ok'
      ? 'rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-7 text-emerald-800'
      : 'rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-7 text-red-800';
  return <div className={cls}>{children}</div>;
}

const INPUT_CLS =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100 disabled:text-slate-400';
const LABEL_CLS = 'mb-1.5 block text-xs font-semibold text-slate-500';

function diffTone(d: string): Tone {
  if (d === 'آسان') return 'green';
  if (d === 'دشوار') return 'red';
  if (d === 'متوسط') return 'amber';
  return 'slate';
}

function scoreTone(s: number): Tone {
  if (s >= 85) return 'green';
  if (s >= 70) return 'amber';
  return 'red';
}

const LETTERS = ['الف', 'ب', 'ج', 'د'];

function QuestionCard({ q, index }: { q: GenQuestion; index: number }) {
  const scoreLabel =
    q.score !== null
      ? 'امتیاز اعتبارسنجی: ' + fa(q.score)
      : q.verdict
        ? 'وضعیت: ' + q.verdict
        : 'در انتظار بررسی ارزیاب';
  const scoreBadgeTone: Tone = q.score !== null ? scoreTone(q.score) : q.verdict ? 'amber' : 'slate';
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge tone="indigo">سوال {fa(index + 1)}</Badge>
        {q.difficulty ? <Badge tone={diffTone(q.difficulty)}>دشواری: {q.difficulty}</Badge> : null}
        {q.cognitive ? <Badge tone="slate">سطح شناختی: {q.cognitive}</Badge> : null}
        <Badge tone={scoreBadgeTone}>{scoreLabel}</Badge>
        <Badge tone="slate">در انتظار بررسی</Badge>
      </div>
      <p className="mb-3 text-sm font-semibold leading-7 text-slate-800">{q.text}</p>
      <ul className="space-y-2">
        {q.options.map((op, i) => (
          <li
            key={i}
            className={
              i === q.correct
                ? 'flex items-start gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900'
                : 'flex items-start gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700'
            }
          >
            <span className="shrink-0 font-bold">{LETTERS[i] ?? ''})</span>
            <span className="leading-6">{op}</span>
            {i === q.correct ? (
              <span className="ms-auto shrink-0 text-xs font-bold text-emerald-600">گزینه صحیح</span>
            ) : null}
          </li>
        ))}
      </ul>
      {q.source ? <p className="mt-2 text-xs text-slate-400">منبع: {q.source}</p> : null}
    </div>
  );
}

/* ---------- صفحه اصلی ---------- */
const TABS: { key: 'wizard' | 'json' | 'ai'; label: string }[] = [
  { key: 'wizard', label: 'تعریف استاندارد' },
  { key: 'json', label: 'ورود سوال با JSON' },
  { key: 'ai', label: 'تولید با هوش مصنوعی' },
];

const AI_PHASES = [
  'ارسال درخواست و تحلیل سوالات موجود فصل',
  'تولید پیش‌نویس سوالات توسط هوش مصنوعی',
  'اعتبارسنجی خودکار کیفیت سوالات',
  'ذخیره‌سازی سوالات در بانک (در انتظار بررسی)',
];

export default function AdminGenPage() {
  const [tab, setTab] = useState<'wizard' | 'json' | 'ai'>('wizard');

  /* استانداردها */
  const [standards, setStandards] = useState<StdRow[]>([]);
  const [stdLoading, setStdLoading] = useState(true);
  const [authErr, setAuthErr] = useState(false);

  /* تب ویزارد */
  const [w, setW] = useState({ code: '', groupName: '', profession: '', job: '', title: '', hours: '60', description: '' });
  const [wChapters, setWChapters] = useState<WizardChapter[]>([{ title: '', weight: 10 }]);
  const [wMsg, setWMsg] = useState<MsgState | null>(null);
  const [wBusy, setWBusy] = useState(false);

  /* تب JSON */
  const [jMode, setJMode] = useState<'full' | 'chapter'>('full');
  const [jText, setJText] = useState('');
  const [jPreview, setJPreview] = useState<JsonPreview | null>(null);
  const [jStdId, setJStdId] = useState('');
  const [jChId, setJChId] = useState('');
  const [jMsg, setJMsg] = useState<MsgState | null>(null);
  const [jBusy, setJBusy] = useState(false);

  /* تب هوش مصنوعی */
  const [aiStdId, setAiStdId] = useState('');
  const [aiChId, setAiChId] = useState('');
  const [aiCount, setAiCount] = useState('10');
  const [aiFocus, setAiFocus] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiElapsed, setAiElapsed] = useState(0);
  const [aiMsg, setAiMsg] = useState<MsgState | null>(null);
  const [aiQuestions, setAiQuestions] = useState<GenQuestion[]>([]);

  async function loadStandards() {
    setStdLoading(true);
    const { status, data } = await apiFetch(API.standards);
    if (status === 401) {
      setAuthErr(true);
    } else {
      setAuthErr(false);
      setStandards(pickList(data).map(mapStd).filter((s) => s.id > 0));
    }
    setStdLoading(false);
  }

  useEffect(() => {
    void loadStandards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!aiBusy) return;
    setAiElapsed(0);
    const t = setInterval(() => setAiElapsed((p) => p + 1), 1000);
    return () => clearInterval(t);
  }, [aiBusy]);

  const aiStd = standards.find((s) => String(s.id) === aiStdId) || null;
  const jStd = standards.find((s) => String(s.id) === jStdId) || null;
  const wSum = wChapters.reduce((s, c) => s + (Number(c.weight) || 0), 0);
  const aiPhaseIdx = Math.min(AI_PHASES.length - 1, Math.floor(aiElapsed / 20));
  const scored = aiQuestions.filter((q) => q.score !== null);
  const passCount = scored.filter((q) => (q.score ?? 0) >= 85).length;
  const warnCount = scored.filter((q) => {
    const s = q.score ?? 0;
    return s >= 70 && s < 85;
  }).length;
  const failCount = scored.filter((q) => (q.score ?? 0) < 70).length;

  /* ---------- ویزارد ---------- */
  function setWField(k: 'code' | 'groupName' | 'profession' | 'job' | 'title' | 'hours' | 'description') {
    return (e: FieldEvent) => setW((p) => ({ ...p, [k]: e.target.value }));
  }

  function addChapter() {
    setWChapters((p) => [...p, { title: '', weight: 5 }]);
  }

  function removeChapter(i: number) {
    setWChapters((p) => (p.length <= 1 ? p : p.filter((_, idx) => idx !== i)));
  }

  async function submitWizard() {
    const errs: string[] = [];
    if (!w.code.trim()) errs.push('کد استاندارد الزامی است.');
    if (!w.title.trim()) errs.push('عنوان استاندارد الزامی است.');
    if (!w.groupName.trim()) errs.push('نام گروه برنامه‌ریزی الزامی است.');
    if (wChapters.some((c) => !c.title.trim())) errs.push('عنوان همه فصل‌ها را وارد کنید.');
    if (wSum !== 40) errs.push('مجموع وزن فصل‌ها باید دقیقاً ۴۰ باشد (فعلاً ' + fa(wSum) + ').');
    if (errs.length > 0) {
      setWMsg({ kind: 'err', text: errs.join(' ') });
      return;
    }
    setWBusy(true);
    setWMsg(null);
    const { ok, status, data } = await apiFetch(API.standards, {
      method: 'POST',
      body: JSON.stringify({
        code: w.code.trim(),
        groupName: w.groupName.trim(),
        profession: w.profession.trim(),
        job: w.job.trim(),
        title: w.title.trim(),
        hours: Number(w.hours) || 60,
        description: w.description.trim(),
        chapters: wChapters.map((c) => ({
          title: c.title.trim(),
          weight: Number(c.weight) || 0,
          bankRequired: (Number(c.weight) || 0) * 10,
        })),
      }),
    });
    setWBusy(false);
    if (status === 401) {
      setAuthErr(true);
      return;
    }
    if (!ok) {
      setWMsg({ kind: 'err', text: str(data.error ?? data.message, 'ثبت استاندارد ناموفق بود (کد ' + fa(status) + ').') });
      return;
    }
    setWMsg({
      kind: 'ok',
      text:
        'استاندارد با ' +
        fa(wChapters.length) +
        ' فصل با موفقیت ثبت شد. اکنون می‌توانید سوالات را از تب «ورود سوال با JSON» وارد کنید یا از تب «تولید با هوش مصنوعی» بسازید.',
    });
    void loadStandards();
  }

  /* ---------- تب JSON ---------- */
  function onJsonFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setJText(String(reader.result ?? ''));
      setJPreview(null);
    };
    reader.readAsText(file);
  }

  function resetJText(v: string) {
    setJText(v);
    setJPreview(null);
  }

  function previewJson() {
    setJMsg(null);
    if (!jText.trim()) {
      setJPreview({ errors: ['متن JSON خالی است.'], warns: [], summary: '', questionsTotal: 0, payload: null, questions: [] });
      return;
    }
    const parsed = parseLooseJson(jText);
    if (parsed.error) {
      const extra =
        parsed.values.length > 0
          ? ' (' + fa(parsed.values.length) + ' بلوک معتبر پیدا شد ولی ساختار کل ناقص است.)'
          : '';
      setJPreview({ errors: [parsed.error + extra], warns: [], summary: '', questionsTotal: 0, payload: null, questions: [] });
      return;
    }
    if (jMode === 'full') {
      setJPreview(normalizeStandardBlocks(parsed.values));
    } else {
      const res = validateQuestionsLoose(parsed.values);
      setJPreview({
        errors: res.errors,
        warns: res.warns,
        summary: res.summary,
        questionsTotal: res.questions.length,
        payload: null,
        questions: res.questions,
      });
    }
  }

  async function importJson() {
    if (!jPreview || jPreview.errors.length > 0) return;
    setJBusy(true);
    setJMsg(null);
    if (jMode === 'full' && jPreview.payload) {
      const { ok, status, data } = await apiFetch(API.standards, {
        method: 'POST',
        body: JSON.stringify(jPreview.payload),
      });
      setJBusy(false);
      if (status === 401) {
        setAuthErr(true);
        return;
      }
      if (!ok) {
        setJMsg({ kind: 'err', text: str(data.error ?? data.message, 'ورود استاندارد ناموفق بود (کد ' + fa(status) + ').') });
        return;
      }
      setJMsg({
        kind: 'ok',
        text:
          'استاندارد با ' +
          fa(jPreview.questionsTotal) +
          ' سوال با موفقیت وارد شد و همه سوالات با وضعیت «در انتظار بررسی» ذخیره شدند.',
      });
      void loadStandards();
      return;
    }
    if (jMode === 'chapter' && jPreview.questions.length > 0) {
      if (!jChId) {
        setJBusy(false);
        setJMsg({ kind: 'err', text: 'برای ورود سوالات به فصل موجود، ابتدا استاندارد و فصل را انتخاب کنید.' });
        return;
      }
      const { ok, status, data } = await apiFetch(API.importQuestions, {
        method: 'POST',
        body: JSON.stringify({ chapterId: Number(jChId), questions: jPreview.questions }),
      });
      setJBusy(false);
      if (status === 401) {
        setAuthErr(true);
        return;
      }
      if (!ok) {
        setJMsg({ kind: 'err', text: str(data.error ?? data.message, 'ورود سوالات ناموفق بود (کد ' + fa(status) + ').') });
        return;
      }
      setJMsg({
        kind: 'ok',
        text: fa(jPreview.questions.length) + ' سوال با وضعیت «در انتظار بررسی» به فصل انتخاب‌شده اضافه شد.',
      });
      void loadStandards();
    }
  }

  /* ---------- تب هوش مصنوعی ---------- */
  async function runAiGenerate() {
    if (!aiChId) {
      setAiMsg({ kind: 'err', text: 'انتخاب فصل الزامی است؛ ابتدا استاندارد و سپس فصل موردنظر را انتخاب کنید.' });
      return;
    }
    const count = Math.max(1, Math.min(20, Number(aiCount) || 10));
    setAiBusy(true);
    setAiMsg(null);
    setAiQuestions([]);
    const { ok, status, data } = await apiFetch(API.aiGenerate, {
      method: 'POST',
      body: JSON.stringify({
        chapterId: Number(aiChId),
        standardId: aiStd ? aiStd.id : undefined,
        count,
        focus: aiFocus.trim() || undefined,
      }),
    });
    setAiBusy(false);
    if (status === 401) {
      setAuthErr(true);
      return;
    }
    if (!ok) {
      setAiMsg({ kind: 'err', text: str(data.error ?? data.message, 'تولید سوالات ناموفق بود (کد ' + fa(status) + ').') });
      return;
    }
    const listRaw = data.questions ?? data.items ?? data.generated ?? data.results ?? [];
    const list = pickList(listRaw).map(mapGenQuestion).filter((q) => q.text.length > 0);
    setAiQuestions(list);
    const created = num(data.created, list.length);
    if (list.length > 0) {
      setAiMsg({
        kind: 'ok',
        text:
          fa(list.length) +
          ' سوال جدید تولید و با وضعیت «در انتظار بررسی» ذخیره شد. این سوالات پس از تایید ارزیاب منتشر می‌شوند.',
      });
    } else if (created > 0) {
      setAiMsg({ kind: 'ok', text: fa(created) + ' سوال ذخیره شد؛ جزئیات را در بانک سوالات ببینید.' });
    } else {
      setAiMsg({ kind: 'err', text: 'هیچ سوالی ذخیره نشد؛ لطفاً دوباره تلاش کنید.' });
    }
    void loadStandards();
  }

  async function copyAiJson() {
    if (aiQuestions.length === 0) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify({ questions: aiQuestions }, null, 2));
      setAiMsg({ kind: 'ok', text: 'JSON سوالات تولیدشده در کلیپ‌بورد کپی شد.' });
    } catch {
      setAiMsg({ kind: 'err', text: 'کپی خودکار ممکن نشد؛ لطفاً دستی کپی کنید.' });
    }
  }

  /* ---------- رندر ---------- */
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-800">تولید و ورود سوالات</h1>
          <p className="mt-1 text-sm text-slate-500">
            تعریف استاندارد و فصل‌ها، ورود سوالات با JSON و تولید سوال با هوش مصنوعی
          </p>
        </div>

        {authErr ? (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-800">
            دسترسی غیرمجاز است؛ احتمالاً توکن مدیر منقضی شده است.{' '}
            <Link href="/admin/login" className="font-bold underline">
              ورود مدیر
            </Link>
          </div>
        ) : null}

        <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={
                'rounded-xl px-4 py-2 text-sm font-bold transition ' +
                (tab === t.key ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100')
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* تب ۱: ویزارد تعریف استاندارد */}
        {tab === 'wizard' ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-slate-800">اطلاعات استاندارد</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={LABEL_CLS}>کد استاندارد (الزامی)</label>
                  <input
                    className={INPUT_CLS}
                    dir="ltr"
                    value={w.code}
                    onChange={setWField('code')}
                    placeholder="مثلاً 3512100023"
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>نام گروه برنامه‌ریزی (الزامی)</label>
                  <input
                    className={INPUT_CLS}
                    value={w.groupName}
                    onChange={setWField('groupName')}
                    placeholder="مثلاً فناوری اطلاعات و ارتباطات"
                  />
                </div>
                <div>
                  <label className={LABEL_CLS}>حرفه</label>
                  <input className={INPUT_CLS} value={w.profession} onChange={setWField('profession')} />
                </div>
                <div>
                  <label className={LABEL_CLS}>شغل</label>
                  <input className={INPUT_CLS} value={w.job} onChange={setWField('job')} />
                </div>
                <div className="md:col-span-2">
                  <label className={LABEL_CLS}>عنوان استاندارد (الزامی)</label>
                  <input className={INPUT_CLS} value={w.title} onChange={setWField('title')} />
                </div>
                <div>
                  <label className={LABEL_CLS}>ساعت آموزش</label>
                  <input
                    className={INPUT_CLS}
                    dir="ltr"
                    type="number"
                    min={0}
                    value={w.hours}
                    onChange={setWField('hours')}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={LABEL_CLS}>شرح استاندارد</label>
                  <textarea
                    className={INPUT_CLS + ' min-h-[6rem]'}
                    value={w.description}
                    onChange={setWField('description')}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-slate-800">فصل‌ها و وزن‌ها</h2>
                <div className={wSum === 40 ? 'text-sm font-bold text-emerald-600' : 'text-sm font-bold text-red-600'}>
                  مجموع وزن‌ها: {fa(wSum)} از ۴۰
                </div>
              </div>
              <div className="space-y-3">
                {wChapters.map((c, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 p-3">
                    <span className="w-6 shrink-0 text-sm text-slate-400">{fa(i + 1)}.</span>
                    <input
                      className={INPUT_CLS + ' flex-1'}
                      value={c.title}
                      onChange={(e) =>
                        setWChapters((p) => p.map((cc, idx) => (idx === i ? { ...cc, title: e.target.value } : cc)))
                      }
                      placeholder="عنوان فصل"
                    />
                    <input
                      className={INPUT_CLS + ' w-24 shrink-0'}
                      dir="ltr"
                      type="number"
                      min={0}
                      max={40}
                      value={c.weight}
                      onChange={(e) =>
                        setWChapters((p) =>
                          p.map((cc, idx) => (idx === i ? { ...cc, weight: Number(e.target.value) || 0 } : cc))
                        )
                      }
                    />
                    <span className="shrink-0 text-xs text-slate-500">بانک: {fa(c.weight * 10)} سوال</span>
                    <button
                      type="button"
                      onClick={() => removeChapter(i)}
                      className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"
                    >
                      حذف
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addChapter}
                className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100"
              >
                افزودن فصل
              </button>
              <p className="mt-3 text-xs leading-6 text-slate-400">
                وزن هر فصل برابر تعداد سوالات آن فصل در آزمون ۴۰ سوالی است؛ مجموع وزن‌ها باید دقیقاً ۴۰ شود. حداقل تعداد
                سوال بانک هر فصل برابر وزن ضربدر ۱۰ است.
              </p>
            </div>

            {wMsg ? <Msg kind={wMsg.kind}>{wMsg.text}</Msg> : null}

            <button
              type="button"
              onClick={submitWizard}
              disabled={wBusy}
              className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {wBusy ? 'در حال ثبت...' : 'ثبت استاندارد'}
            </button>
          </div>
        ) : null}

        {/* تب ۲: ورود سوال با JSON */}
        {tab === 'json' ? (
          <div className="space-y-6">
            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setJMode('full');
                  setJPreview(null);
                }}
                className={
                  'rounded-2xl border p-4 text-right transition ' +
                  (jMode === 'full' ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50')
                }
              >
                <span className={'block font-bold ' + (jMode === 'full' ? 'text-indigo-800' : 'text-slate-800')}>
                  ورود استاندارد کامل
                </span>
                <span className="mt-1 block text-xs leading-6 text-slate-500">
                  JSON کامل شامل استاندارد، فصل‌ها و سوالات (خروجی پرامپت تولید سوال)
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setJMode('chapter');
                  setJPreview(null);
                }}
                className={
                  'rounded-2xl border p-4 text-right transition ' +
                  (jMode === 'chapter' ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50')
                }
              >
                <span className={'block font-bold ' + (jMode === 'chapter' ? 'text-indigo-800' : 'text-slate-800')}>
                  ورود سوالات به یک فصل موجود
                </span>
                <span className="mt-1 block text-xs leading-6 text-slate-500">
                  آرایه سوالات یا شیء دارای کلید questions برای فصل انتخابی
                </span>
              </button>
            </div>

            {jMode === 'chapter' ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className={LABEL_CLS}>استاندارد</label>
                    <select
                      className={INPUT_CLS}
                      value={jStdId}
                      onChange={(e) => {
                        setJStdId(e.target.value);
                        setJChId('');
                      }}
                    >
                      <option value="">{stdLoading ? 'در حال دریافت استانداردها...' : '— انتخاب استاندارد —'}</option>
                      {standards.map((s) => (
                        <option key={s.id} value={String(s.id)}>
                          {s.title || s.code}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL_CLS}>فصل (الزامی)</label>
                    <select
                      className={INPUT_CLS}
                      value={jChId}
                      onChange={(e) => setJChId(e.target.value)}
                      disabled={!jStd}
                    >
                      <option value="">— انتخاب فصل —</option>
                      {(jStd ? jStd.chapters : []).map((c) => (
                        <option key={c.id} value={String(c.id)}>
                          {chapterLabel(c)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-slate-800">متن JSON</h2>
                <label className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100">
                  انتخاب فایل
                  <input
                    type="file"
                    accept=".json,.txt,application/json,text/plain"
                    onChange={onJsonFile}
                    className="hidden"
                  />
                </label>
              </div>
              <textarea
                className={INPUT_CLS + ' min-h-[14rem] font-mono text-xs'}
                dir="ltr"
                value={jText}
                onChange={(e) => resetJText(e.target.value)}
                placeholder={
                  jMode === 'full'
                    ? '{ "standard": { "code": "...", "title": "...", "chapters": [ { "title": "...", "weight": 5, "questions": [ ... ] } ] } }'
                    : '[ { "text": "...", "options": ["...","...","...","..."], "correct": 0, "cognitive": "فهم", "difficulty": "آسان", "source": "..." } ]'
                }
              />
              <p className="mt-2 text-xs leading-6 text-slate-400">
                اگر چند بلوک JSON پشت‌سرهم و بدون کاما در فایل باشد (مثل خروجی چند مرحله‌ای تولید)، به‌صورت خودکار جدا و
                ادغام می‌شود.
              </p>
              <button
                type="button"
                onClick={previewJson}
                className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
              >
                بررسی و پیش‌نمایش
              </button>
            </div>

            {jPreview ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-3 text-lg font-bold text-slate-800">نتیجه بررسی</h2>
                {jPreview.summary ? (
                  <p className="mb-3 text-sm font-bold text-indigo-700">{jPreview.summary}</p>
                ) : null}
                {jPreview.errors.length > 0 ? (
                  <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3">
                    <p className="mb-1 text-xs font-bold text-red-700">
                      خطاها ({fa(jPreview.errors.length)}) — تا رفع خطاها ورود امکان‌پذیر نیست:
                    </p>
                    <ul className="list-inside list-disc space-y-1 text-xs leading-6 text-red-700">
                      {jPreview.errors.slice(0, 12).map((er, i) => (
                        <li key={i}>{er}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {jPreview.warns.length > 0 ? (
                  <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <p className="mb-1 text-xs font-bold text-amber-700">هشدارها ({fa(jPreview.warns.length)}):</p>
                    <ul className="list-inside list-disc space-y-1 text-xs leading-6 text-amber-700">
                      {jPreview.warns.slice(0, 12).map((wn, i) => (
                        <li key={i}>{wn}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {jMode === 'full' && jPreview.payload ? (
                  <button
                    type="button"
                    onClick={importJson}
                    disabled={jBusy}
                    className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {jBusy ? 'در حال ورود...' : 'ورود استاندارد و سوالات'}
                  </button>
                ) : null}
                {jMode === 'chapter' && jPreview.questions.length > 0 && jPreview.errors.length === 0 ? (
                  <button
                    type="button"
                    onClick={importJson}
                    disabled={jBusy}
                    className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {jBusy ? 'در حال ورود...' : 'ورود سوالات به فصل'}
                  </button>
                ) : null}
              </div>
            ) : null}

            {jMsg ? <Msg kind={jMsg.kind}>{jMsg.text}</Msg> : null}
          </div>
        ) : null}

        {/* تب ۳: تولید با هوش مصنوعی */}
        {tab === 'ai' ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm leading-7 text-indigo-900">
              سوالات بر اساس محتوای فصل انتخابی و با تحلیل سوالات موجود همان فصل تولید می‌شوند تا از تکرار موضوع و الگو
              جلوگیری شود. تولید سوال فقط برای «یک فصل مشخص» انجام می‌شود و انتخاب فصل الزامی است. سوالات تولیدشده پس از
              اعتبارسنجی خودکار با وضعیت «در انتظار بررسی» ذخیره می‌شوند و پس از تایید ارزیاب منتشر خواهند شد.
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={LABEL_CLS}>استاندارد</label>
                  <select
                    className={INPUT_CLS}
                    value={aiStdId}
                    onChange={(e) => {
                      setAiStdId(e.target.value);
                      setAiChId('');
                    }}
                    disabled={stdLoading}
                  >
                    <option value="">{stdLoading ? 'در حال دریافت استانداردها...' : '— انتخاب استاندارد —'}</option>
                    {standards.map((s) => (
                      <option key={s.id} value={String(s.id)}>
                        {(s.title || s.code) + (s.chapters.length > 0 ? ' (' + fa(s.chapters.length) + ' فصل)' : '')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLS}>فصل (الزامی)</label>
                  <select
                    className={INPUT_CLS}
                    value={aiChId}
                    onChange={(e) => setAiChId(e.target.value)}
                    disabled={!aiStd}
                  >
                    <option value="">— انتخاب فصل —</option>
                    {(aiStd ? aiStd.chapters : []).map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {chapterLabel(c)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLS}>تعداد سوال (۱ تا ۲۰)</label>
                  <input
                    className={INPUT_CLS}
                    dir="ltr"
                    type="number"
                    min={1}
                    max={20}
                    value={aiCount}
                    onChange={(e) => setAiCount(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={LABEL_CLS}>تمرکز موضوعی (اختیاری)</label>
                  <textarea
                    className={INPUT_CLS + ' min-h-[5rem]'}
                    value={aiFocus}
                    onChange={(e) => setAiFocus(e.target.value)}
                    placeholder="مثلاً: تمرکز بر ایمنی، استاندارد عملکرد و تجهیزات اندازه‌گیری"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={runAiGenerate}
                disabled={aiBusy || !aiChId}
                className="mt-4 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {aiBusy ? 'در حال تولید...' : 'تولید سوال با هوش مصنوعی'}
              </button>
              {!aiChId ? (
                <p className="mt-2 text-xs text-red-500">برای فعال شدن دکمه تولید، انتخاب فصل الزامی است.</p>
              ) : null}
            </div>

            {aiBusy ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 h-1.5 w-full rounded-full bg-indigo-100">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all duration-1000"
                    style={{ width: ((aiPhaseIdx + 1) / AI_PHASES.length) * 100 + '%' }}
                  />
                </div>
                <ul className="space-y-2 text-sm">
                  {AI_PHASES.map((p, i) => (
                    <li
                      key={p}
                      className={
                        i < aiPhaseIdx
                          ? 'text-emerald-600'
                          : i === aiPhaseIdx
                            ? 'font-bold text-indigo-700'
                            : 'text-slate-400'
                      }
                    >
                      {i < aiPhaseIdx ? 'انجام شد — ' : i === aiPhaseIdx ? 'در حال انجام — ' : 'در انتظار — '}
                      {p}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs leading-6 text-slate-400">
                  زمان سپری‌شده: {fa(aiElapsed)} ثانیه — تولید معمولاً بین ۳۰ تا ۱۲۰ ثانیه طول می‌کشد؛ صفحه را نبندید.
                </p>
              </div>
            ) : null}

            {aiMsg ? <Msg kind={aiMsg.kind}>{aiMsg.text}</Msg> : null}

            {aiQuestions.length > 0 ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-slate-800">سوالات تولیدشده ({fa(aiQuestions.length)})</h2>
                  <button
                    type="button"
                    onClick={copyAiJson}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100"
                  >
                    کپی JSON سوالات
                  </button>
                </div>
                {scored.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm">
                      <p className="text-lg font-extrabold text-slate-800">{fa(aiQuestions.length)}</p>
                      <p className="text-xs text-slate-500">تولیدشده</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-200 bg-white p-3 text-center shadow-sm">
                      <p className="text-lg font-extrabold text-emerald-600">{fa(passCount)}</p>
                      <p className="text-xs text-slate-500">قبول (۸۵ و بالاتر)</p>
                    </div>
                    <div className="rounded-2xl border border-amber-200 bg-white p-3 text-center shadow-sm">
                      <p className="text-lg font-extrabold text-amber-600">{fa(warnCount)}</p>
                      <p className="text-xs text-slate-500">نیازمند بازبینی</p>
                    </div>
                    <div className="rounded-2xl border border-red-200 bg-white p-3 text-center shadow-sm">
                      <p className="text-lg font-extrabold text-red-600">{fa(failCount)}</p>
                      <p className="text-xs text-slate-500">ضعیف</p>
                    </div>
                  </div>
                ) : null}
                {aiQuestions.map((q, i) => (
                  <QuestionCard key={q.id > 0 ? q.id : 'q-' + i} q={q} index={i} />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
