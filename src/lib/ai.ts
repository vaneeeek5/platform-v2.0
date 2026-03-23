import axios from 'axios'
import crypto from 'crypto'

const OPENROUTER_API = 'https://openrouter.ai/api/v1'

export type AIRecommendation = {
  content: string
  dataHash: string
}

export async function generateRecommendations(
  data: Record<string, unknown>
): Promise<AIRecommendation> {
  const dataStr = JSON.stringify(data)
  const dataHash = crypto.createHash('sha256').update(dataStr).digest('hex')

  const prompt = `Ты — AI-аналитик маркетинговой платформы. 
Проанализируй данные и дай конкретные рекомендации по улучшению:

Данные:
${dataStr}

Дай 3-5 конкретных рекомендации по:
1. Оптимизации рекламных расходов
2. Улучшению конверсии лидов
3. Снижению CPL (стоимости лида)
4. Наиболее эффективным каналам

Отвечай на русском языке, кратко и конкретно.`

  const res = await axios.post(
    `${OPENROUTER_API}/chat/completions`,
    {
      model: 'anthropic/claude-3-haiku',
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL,
        'X-Title': 'Marketing Platform',
      },
    }
  )

  const content = res.data.choices[0]?.message?.content || ''
  return { content, dataHash }
}
