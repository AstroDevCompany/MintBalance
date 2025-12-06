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
  const fallbackPrediction = () => {
    const expenses = transactions.filter((t) => t.type === 'expense')
    const expenseTotal = expenses.reduce((acc, t) => acc + t.amount, 0)
    const avgExpense =
      expenses.length > 0 ? expenseTotal / Math.max(1, expenses.length) : 0
    const subMonthly = subscriptions
      .filter((s) => s.active)
      .reduce((acc, s) => {
        const freq = s.frequency
        if (freq === 'weekly') return acc + s.amount * 4.345
        if (freq === 'quarterly') return acc + s.amount / 3
        if (freq === 'annual') return acc + s.amount / 12
        return acc + s.amount
      }, 0)
    const totalEstimate = expenseTotal + subMonthly
    const summary = [
      `Estimated total for ${timeframe}: ${totalEstimate.toLocaleString(undefined, { style: 'currency', currency })}`,
      `Recent avg expense: ${avgExpense.toLocaleString(undefined, { style: 'currency', currency })} (${expenses.length} items)`,
      `Active subscriptions monthly: ${subMonthly.toLocaleString(undefined, { style: 'currency', currency })}`,
    ].join('\n')
    return { summary, totalEstimate }
  }

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
    try {
      const text = await invokeLocalLlm(prompt)
      const lowerText = text.toLowerCase()
      const looksLikeEcho =
        lowerText.includes('local model placeholder') ||
        (lowerText.includes('summarize upcoming expenses') && lowerText.includes('estimated total')) ||
        lowerText.trim() === prompt.trim().toLowerCase()
      if (looksLikeEcho) {
        return fallbackPrediction()
      }

      const match = text.match(/Estimated total:\s*([\d.,]+)/i)
      const totalEstimate = match ? Number(match[1].replace(/,/g, '')) : undefined
      if (totalEstimate === undefined) {
        return { ...fallbackPrediction(), summary: text || fallbackPrediction().summary }
      }
      return { summary: text, totalEstimate }
    } catch {
      return fallbackPrediction()
    }
  }

  return predictWithGemini({ apiKey, timeframe, currency, transactions, subscriptions })
}

const fallbackInsights = (
  transactions: Transaction[],
  subscriptions: Subscription[],
  currency: string,
  max = 6,
): string[] => {
  const expenses = transactions.filter((t) => t.type === 'expense')
  const total = expenses.reduce((acc, t) => acc + t.amount, 0)
  const byCategory: Record<string, number> = {}
  const byMerchant: Record<string, number> = {}
  let biggest = { source: '', amount: 0, category: '' }

  expenses.forEach((t) => {
    byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount
    byMerchant[t.source] = (byMerchant[t.source] ?? 0) + 1
    if (t.amount > biggest.amount) biggest = { source: t.source, amount: t.amount, category: t.category }
  })

  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]
  const topMerchant = Object.entries(byMerchant).sort((a, b) => b[1] - a[1])[0]

  const insights: string[] = []
  insights.push(
    `Total expenses: ${total.toLocaleString(undefined, { style: 'currency', currency })}`,
  )
  if (topCategory) {
    insights.push(
      `Top category: ${topCategory[0]} (${topCategory[1].toLocaleString(undefined, { style: 'currency', currency })})`,
    )
  }
  if (topMerchant) {
    insights.push(
      `Most visited merchant: ${topMerchant[0]} (${topMerchant[1]} time${topMerchant[1] === 1 ? '' : 's'})`,
    )
  }
  if (biggest.amount > 0) {
    insights.push(
      `Largest expense: ${biggest.source} (${biggest.category}) at ${biggest.amount.toLocaleString(undefined, { style: 'currency', currency })}`,
    )
  }
  if (subscriptions.length) {
    const activeSubs = subscriptions.filter((s) => s.active).length
    insights.push(`Active subscriptions: ${activeSubs} (of ${subscriptions.length})`)
  }
  if (expenses.length >= 3) {
    const avg = total / expenses.length
    insights.push(
      `Avg expense size: ${avg.toLocaleString(undefined, { style: 'currency', currency })}`,
    )
  }

  return insights.slice(0, max)
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
  const fallback = () => fallbackInsights(transactions, subscriptions, currency, maxInsights)

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
    try {
      const text = await invokeLocalLlm(prompt)
      const lowerText = text.toLowerCase()
      if (
        lowerText.includes('local model placeholder') ||
        lowerText.includes('generate up to') // prompt echo
      ) {
        return fallback()
      }

      const cleaned = text
        .split(/\r?\n/)
        .map((line) => line.replace(/^[\-\u2022•ƒ?›\d.]+\s*/, '').trim())
        .filter(Boolean)

      const looksLikePromptEcho =
        cleaned.length === 1 &&
        cleaned[0].toLowerCase().includes('generate up to') &&
        cleaned[0].toLowerCase().includes('insights')

      if (looksLikePromptEcho || !cleaned.length) {
        return fallback()
      }

      return cleaned.slice(0, maxInsights)
    } catch {
      return fallback()
    }
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
