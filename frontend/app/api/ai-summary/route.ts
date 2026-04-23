import { NextRequest, NextResponse } from 'next/server';

function buildPrompt(stats: any, fuente?: string, fechaDesde?: string, fechaHasta?: string) {
  const fuenteFilter = fuente ? `fuente: ${fuente}` : 'todas las fuentes';
  const dateFilter =
    fechaDesde || fechaHasta
      ? `periodo: ${fechaDesde ?? 'inicio'} → ${fechaHasta ?? 'hoy'}`
      : 'todo el historial';

  return `Eres un analista de marketing digital especializado en embudos de ventas para creadores digitales.

Analiza los siguientes datos de leads y genera un resumen ejecutivo en español.

DATOS:
- Total de leads: ${stats.total}
- Leads últimos 7 días: ${stats.last7Days}
- Presupuesto promedio: $${Math.round(stats.avgBudget)} USD
- Distribución por fuente: ${JSON.stringify(stats.bySource)}
- Filtro aplicado: ${fuenteFilter}, ${dateFilter}

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta (sin markdown, sin explicaciones):
{
  "analisisGeneral": "párrafo de 2-3 oraciones con el análisis del estado actual de los leads",
  "fuentePrincipal": "nombre de la fuente con mayor volumen",
  "recomendaciones": ["recomendación 1", "recomendación 2", "recomendación 3"]
}`;
}

async function callOpenAI(apiKey: string, prompt: string) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 500,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Error ${res.status} de OpenAI`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

async function callClaude(apiKey: string, prompt: string) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Error ${res.status} de Anthropic`);
  }
  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}

export async function POST(req: NextRequest) {
  const provider = req.headers.get('x-provider') ?? 'openai';
  const apiKey = req.headers.get('x-api-key');

  if (!apiKey) {
    return NextResponse.json({ error: 'API key no proporcionada' }, { status: 400 });
  }

  const { stats, fuente, fechaDesde, fechaHasta } = await req.json();
  const prompt = buildPrompt(stats, fuente, fechaDesde, fechaHasta);

  try {
    const raw = provider === 'claude'
      ? await callClaude(apiKey, prompt)
      : await callOpenAI(apiKey, prompt);

    // Strip possible markdown code fences before parsing
    const clean = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(clean);
    return NextResponse.json(parsed);
  } catch (e: any) {
    const isParseError = e instanceof SyntaxError;
    return NextResponse.json(
      { error: isParseError ? 'Respuesta inválida del modelo' : e.message },
      { status: isParseError ? 500 : 502 },
    );
  }
}
