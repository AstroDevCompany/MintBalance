import type { Subscription, Transaction } from '../types'
import {
  categorizeExpenseWithGemini,
  generateSpendingInsights,
  predictWithGemini,
  extractCategory,
} from './gemini'
import { invokeLocalLlm } from './localModel'

type AiMode = 'cloud' | 'local'

const techKeywords = [
  'laptop',
  'computer',
  'pc',
  'macbook',
  'imac',
  'ipad',
  'iphone',
  'android',
  'phone',
  'tablet',
  'gpu',
  'cpu',
  'ssd',
  'ram',
  'graphics',
  'nvidia',
  'amd',
  'intel',
  'monitor',
  'keyboard',
  'mouse',
  'headset',
]

const applyCategoryHeuristics = (source: string, chosen: string, categories: string[]) => {
  const lowerSource = source.toLowerCase()
  const hasTechKeyword = techKeywords.some((kw) => lowerSource.includes(kw))
  if (hasTechKeyword) {
    if (categories.includes('Tech')) return 'Tech'
    if (categories.includes('Utilities')) return 'Utilities'
  }
  return chosen
}

export const categorizeExpenseAi = async ({
  mode,
  apiKey,
  currency,
  categories,
  amount,
  source,
  notes,
}: {
  mode: AiMode
  apiKey: string
  currency: string
  categories: string[]
  amount: number
  source: string
  notes?: string
}) => {
  const categoryList = categories

  if (mode === 'local') {
    const prompt = `
You categorize expenses using only these categories: ${categories.join(', ')}.
Return a JSON object like {"category":"OneOfAbove"} with no extra text.
Expense:
- Merchant: ${source}
- Amount: ${amount} ${currency}
- Notes: ${notes ?? 'None'}
`
    const response = await invokeLocalLlm(prompt)
    const picked = extractCategory(response, categoryList)
    return applyCategoryHeuristics(source, picked, categoryList)
  }

  const picked = await categorizeExpenseWithGemini({
    apiKey,
    currency,
    categories: categoryList,
    amount,
    source,
    notes,
  })
  return applyCategoryHeuristics(source, picked, categoryList)
}

export const predictExpensesAi = async ({
  mode,
  apiKey,
  timeframe,
  currency,
  transactions,
  subscriptions,
}: {
  mode: AiMode
  apiKey: string
  timeframe: string
  currency: string
  transactions: Transaction[]
  subscriptions: Subscription[]
}) => {
  if (mode === 'local') {
    const prompt = `
Summarize upcoming expenses for timeframe "${timeframe}" in ${currency}.
Return 3-5 concise bullets and end with a line: Estimated total: <number only>.
Transactions:
${transactions
  .slice(0, 40)
  .map((t) => `${t.date} | ${t.type} | ${t.category} | ${t.source} | ${t.amount}`)
  .join('\n')}
Subscriptions:
${subscriptions
  .slice(0, 20)
  .map((s) => `${s.name} | ${s.frequency} | ${s.amount} due ${s.nextPayment}`)
  .join('\n')}
`
    const text = await invokeLocalLlm(prompt)
    const match = text.match(/Estimated total:\s*([\d.,]+)/i)
    const totalEstimate = match ? Number(match[1].replace(/,/g, '')) : undefined
    return { summary: text, totalEstimate }
  }

  return predictWithGemini({ apiKey, timeframe, currency, transactions, subscriptions })
}

export const generateSpendingInsightsAi = async ({
  mode,
  apiKey,
  currency,
  transactions,
  subscriptions,
  lookbackLabel,
  firstName,
  maxInsights = 6,
}: {
  mode: AiMode
  apiKey: string
  currency: string
  transactions: Transaction[]
  subscriptions: Subscription[]
  lookbackLabel: string
  firstName?: string
  maxInsights?: number
}) => {
  if (mode === 'local') {
    const prompt = `Generate up to ${maxInsights} concise spending insights (140 chars max each) for ${
      firstName || 'the user'
    }. Use the AI spending insights guide: category comparisons, merchants, behaviors, recurring changes, anomalies, budgets, forecasts. Bullet list only (no numbering).
Lookback: ${lookbackLabel}
Transactions (recent first):
${transactions
  .slice(0, 60)
  .map((t) => `${t.date} | ${t.category} | ${t.source} | ${t.amount} | ${t.notes ?? ''}`)
  .join('\n')}
Subscriptions:
${subscriptions
  .slice(0, 20)
  .map((s) => `${s.name} | ${s.frequency} | ${s.amount} | next ${s.nextPayment}`)
  .join('\n')}
`
    const text = await invokeLocalLlm(prompt)
    return text
      .split(/\r?\n/)
      .map((line) => line.replace(/^[\-\u2022•\d.]+\s*/, '').trim())
      .filter(Boolean)
      .slice(0, maxInsights)
  }

  return generateSpendingInsights({
    apiKey,
    currency,
    transactions,
    subscriptions,
    lookbackLabel,
    firstName,
    maxInsights,
  })
}
