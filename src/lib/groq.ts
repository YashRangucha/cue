import { fillTemplate } from './prompts';

const BASE = 'https://api.groq.com/openai/v1';

export interface Suggestion {
  type: 'QUESTION' | 'TALKING_POINT' | 'ANSWER' | 'FACT_CHECK' | 'CLARIFY';
  title: string;
  subtitle: string;
}

function parseSuggestions(raw: string): Suggestion[] {
  const cleaned = raw.replace(/```json|```/gi, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    return parsed.suggestions || [];
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]).suggestions || [];
    }
    throw new Error('Parse failed');
  }
}

export async function generateSuggestions(
  template: string,
  transcript: string,
  prev: string[],
  apiKey: string,
  model: string
): Promise<Suggestion[]> {
  const prompt = fillTemplate(template, {
    transcript,
    previousSuggestions: prev.join('\n') || 'None',
  });

  const STRICT_SUFFIX = '\n\nIMPORTANT: Respond with ONLY the JSON object. No text before or after. No markdown fences.';

  const call = async (m: string, strictMode = false): Promise<Suggestion[]> => {
    const finalPrompt = strictMode ? prompt + STRICT_SUFFIX : prompt;

    const res = await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: m,
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content: 'You are a JSON API. Respond only with valid JSON. No markdown, no explanation, no preamble.',
          },
          { role: 'user', content: finalPrompt },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
      throw Object.assign(
        new Error(err?.error?.message ?? `API error: ${res.status}`),
        { status: res.status }
      );
    }

    const data = await res.json() as { choices?: { message: { content: string } }[] };
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Empty response from model');
    }

    try {
      return parseSuggestions(data.choices[0].message.content);
    } catch {
      if (!strictMode) return call(m, true);
      throw new Error('Parse failed after retry');
    }
  };

  try {
    return await call(model);
  } catch (err) {
    const e = err as { status?: number };
    if (e?.status && e.status !== 429 && e.status !== 500 && e.status !== 503) {
      throw err;
    }
    return await call('openai/gpt-oss-20b');
  }
}

export async function transcribeAudio(
  audioBlob: Blob,
  apiKey: string,
  extension = 'webm'
): Promise<string> {
  const formData = new FormData();
  // Filename extension MUST match actual audio format.
  // Groq Whisper uses the extension to determine codec.
  const filename = `audio.${extension}`;
  formData.append('file', audioBlob, filename);
  formData.append('model', 'whisper-large-v3');
  formData.append('language', 'en');
  formData.append('response_format', 'json');
  formData.append('temperature', '0');

  const res = await fetch(`${BASE}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw Object.assign(
      new Error(err?.error?.message ?? `Transcription failed: ${res.status}`),
      { status: res.status }
    );
  }

  const data = await res.json() as { text?: string };
  return data.text?.trim() ?? '';
}

export async function streamChatResponse(
  messages: { role: string; content: string }[],
  apiKey: string,
  model: string,
  onToken: (t: string) => void,
  onDone: () => void,
  onError: (e: Error) => void,
  temperature = 0.6
) {
  try {
    const res = await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        stream: true,
        temperature,
        messages,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
      throw Object.assign(
        new Error(err?.error?.message ?? `API error: ${res.status}`),
        { status: res.status }
      );
    }

    if (!res.body) throw new Error('No body');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6);
        if (payload === '[DONE]') return onDone();
        try {
          const json = JSON.parse(payload);
          const token = json.choices?.[0]?.delta?.content;
          if (token) onToken(token);
        } catch {
          // skip malformed SSE lines
        }
      }
    }

    onDone();
  } catch (e) {
    onError(e instanceof Error ? e : new Error(String(e)));
  }
}
