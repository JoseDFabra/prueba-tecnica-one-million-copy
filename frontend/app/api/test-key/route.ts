import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { provider, apiKey } = await req.json();

  if (!apiKey || !provider) {
    return NextResponse.json({ valid: false, error: 'Parámetros incompletos' }, { status: 400 });
  }

  try {
    if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      return NextResponse.json({ valid: res.ok });
    }

    if (provider === 'claude') {
      // Minimal call: 1-token response to validate key
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'ok' }],
        }),
      });
      return NextResponse.json({ valid: res.ok });
    }

    return NextResponse.json({ valid: false, error: 'Provider desconocido' }, { status: 400 });
  } catch {
    return NextResponse.json({ valid: false, error: 'Error de red' }, { status: 502 });
  }
}
