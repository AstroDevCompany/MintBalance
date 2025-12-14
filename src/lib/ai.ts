import type { Subscription, Transaction } from '../types'
import { callMintAiChat } from './mintai'

export const extractCategory = (text: string, categories: string[]) => {
  const normalizedOptions = categories.map((c) => c.toLowerCase())
  const jsonMatch = text.match(/\{[\s\S]*?\}/)

  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as { category?: string }
      const candidate = parsed.category?.trim().toLowerCase()
      if (candidate) {
        const idx = normalizedOptions.findIndex((c) => c === candidate)
        if (idx !== -1) return categories[idx]
      }
    } catch {
      // ignore parse failures and fall through
    }
  }

  const looseMatch = normalizedOptions.find((option) =>
    text.toLowerCase().includes(option),
  )
  if (looseMatch) {
    const idx = normalizedOptions.indexOf(looseMatch)
    return categories[idx]
  }

  return 'Other'
}

export const categorizeExpenseAi = async ({
  currency,
  categories,
  amount,
  source,
  notes,
}: {
  currency: string
  categories: string[]
  amount: number
  source: string
  notes?: string
}) => {
  const response = await callMintAiChat(
    [
      {
        role: 'system',
        content:
          'You are MintAI, an expense classifier. Only respond with JSON. Use one category from the provided list and return: {"category":"OneOfTheProvidedCategories"}',
      },
      {
        role: 'user',
        content: [
          `Categories: ${categories.join(', ')}`,
          `Merchant/Source: ${source}`,
          `Amount: ${amount} ${currency}`,
          `Notes: ${notes?.trim() || 'None'}`,
          'Return exactly one JSON object with the category.',
        ].join('\n'),
      },
    ],
    { maxTokens: 80, temperature: 0.1 },
  )

  return extractCategory(response, categories)
}

const formatTransactions = (transactions: Transaction[]) =>
  transactions
    .slice(0, 20)
    .map(
      (t) =>
        `${t.type === 'income' ? 'Income' : 'Expense'} ${t.category} - ${
          t.source
        }: ${t.amount} on ${t.date}`,
    )
    .join('\n')

const formatSubscriptions = (subscriptions: Subscription[]) =>
  subscriptions
    .slice(0, 15)
    .map(
      (s) =>
        `${s.name} (${s.frequency}) - ${s.amount} due ${s.nextPayment} [${
          s.active ? 'active' : 'paused'
        }]`,
    )
    .join('\n')

export const predictExpensesAi = async ({
  timeframe,
  currency,
  transactions,
  subscriptions,
}: {
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

  try {
    const prompt = `
You are MintAI, a financial forecaster. Based on the history below, forecast expenses for the timeframe "${timeframe}" in ${currency}.
Keep it concise, list 3-5 insights, highlight risky categories, and end with a single line starting with "Estimated total:" followed by a number only (no currency symbol).

Transactions:
${formatTransactions(transactions)}

Subscriptions:
${formatSubscriptions(subscriptions)}
`

    const text = await callMintAiChat(
      [
        {
          role: 'system',
          content:
            'You are MintAI. Provide concise spending forecasts and always include "Estimated total:" on the final line.',
        },
        { role: 'user', content: prompt },
      ],
      { maxTokens: 360, temperature: 0.35 },
    )
    const match = text.match(/Estimated total:\s*([\d.,]+)/i)
    const totalEstimate = match ? Number(match[1].replace(/,/g, '')) : undefined

    if (totalEstimate === undefined) {
      const fallback = fallbackPrediction()
      return { ...fallback, summary: text || fallback.summary }
    }

    return {
      summary: text,
      totalEstimate,
    }
  } catch {
    return fallbackPrediction()
  }
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
  currency,
  transactions,
  subscriptions,
  lookbackLabel,
  firstName,
  maxInsights = 6,
}: {
  currency: string
  transactions: Transaction[]
  subscriptions: Subscription[]
  lookbackLabel: string
  firstName?: string
  maxInsights?: number
}) => {
  const fallback = () => fallbackInsights(transactions, subscriptions, currency, maxInsights)

  const condensedTransactions = transactions
    .slice(0, 60)
    .map(
      (t) =>
        `${t.date} | ${t.type === 'income' ? 'Income' : 'Expense'} | ${t.category} | ${
          t.source
        } | ${t.amount} | ${t.notes ?? ''}`,
    )
    .join('\n')

  const condensedSubscriptions = subscriptions
    .slice(0, 20)
    .map((s) => `${s.name} | ${s.frequency} | ${s.amount} | next ${s.nextPayment}`)
    .join('\n')

  try {
    const prompt = `You are MintAI. Generate up to ${maxInsights} concise spending insights for ${
      firstName || 'the user'
    } based on recent data. Use the styles in the "AI spending insights" guide: category comparisons, merchant highlights, behavior patterns, recurring payment changes, anomalies, budget advisory, forecasts. Keep each insight under 140 characters, use ${currency} symbols or amounts when relevant, and avoid fluff.
Return ONLY a plain bullet list with "-" prefix (no numbering, no code fences, no JSON). Do not repeat the same category twice unless meaningful.

Lookback window: ${lookbackLabel}
Transactions (most recent first):
${condensedTransactions || 'None'}

Subscriptions:
${condensedSubscriptions || 'None'}
`

    const text = await callMintAiChat(
      [
        {
          role: 'system',
          content:
            'You are MintAI. Return concise bullet-point spending insights only. No commentary outside the bullets.',
        },
        { role: 'user', content: prompt },
      ],
      { maxTokens: 480, temperature: 0.3 },
    )

    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length)

    const bullets = lines
      .map((line) => line.replace(/^[-\u2022•\d.]+\s*/, '').trim())
      .filter((line) => line.length)

    if (!bullets.length) return fallback()
    return bullets.slice(0, maxInsights)
  } catch {
    return fallback()
  }
}
