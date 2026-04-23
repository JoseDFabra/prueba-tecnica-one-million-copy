import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-openai-key');
  if (!apiKey) {
    return NextResponse.json({ error: 'API key no proporcionada' }, { status: 400 });
  }

  const body = await req.json();
  const { stats, fuente, fechaDesde, fechaHasta } = body;

  const fuenteFilter = fuente ? `fuente: ${fuente}` : 'todas las fuentes';
  const dateFilter =
    fechaDesde || fechaHasta
      ? `periodo: ${fechaDesde ?? 'inicio'} → ${fechaHasta ?? 'hoy'}`
      : 'todo el historial';

  const prompt = `Eres un analista de marketing digital especializado en embudos de ventas para creadores digitales.

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

  const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 500,
    }),
  });

  if (!openAiRes.ok) {
    const err = await openAiRes.json().catch(() => ({}));
    const message = err?.error?.message ?? `Error ${openAiRes.status} de OpenAI`;
    return NextResponse.json({ error: message }, { status: openAiRes.status });
  }

  const data = await openAiRes.json();
  const content = data.choices?.[0]?.message?.content ?? '';

  try {
    const parsed = JSON.parse(content);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: 'Respuesta inválida del modelo' }, { status: 500 });
  }
}
