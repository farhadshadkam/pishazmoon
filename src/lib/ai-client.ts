// ─── کلاینت هوش مصنوعی (OpenAI-compatible) ───
export async function callAI(systemPrompt: string, userPrompt: string, maxTokens: number = 4000): Promise<string> {
  const apiKey = process.env.AI_API_KEY;
  const apiUrl = process.env.AI_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
  const model = process.env.AI_MODEL || 'anthropic/claude-3.5-sonnet';

  if (!apiKey) {
    throw new Error('AI_API_KEY تنظیم نشده است. در لیارا متغیر محیطی را اضافه کنید.');
  }

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://pishazmoun.ir',
      'X-Title': 'Pish-Azmoon',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.85,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`خطای AI: ${res.status} — ${err.error?.message || 'ناشناخته'}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// ─── پارس JSON از پاسخ AI (حتی اگر داخل بلوک کد باشد) ───
export function parseAIJson(response: string): any {
  // حذف بلوک‌های markdown
  let cleaned = response.trim();
  const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) cleaned = jsonMatch[1].trim();

  // پیدا کردن اولین { و آخرین }
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('پاسخ AI شامل JSON معتبر نیست');

  const jsonStr = cleaned.substring(start, end + 1);
  return JSON.parse(jsonStr);
}
