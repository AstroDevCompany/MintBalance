import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Subscription, Transaction } from '../types'

type PredictionInput = {
  apiKey: string
  timeframe: string
  currency: string
  transactions: Transaction[]
  subscriptions: Subscription[]
}

type CategorizeExpenseInput = {
  apiKey: string
  amount: number
  currency: string
  source: string
  notes?: string
  categories: string[]
}

type SpendingInsightsInput = {
  apiKey: string
  currency: string
  transactions: Transaction[]
  subscriptions: Subscription[]
  lookbackLabel: string
  firstName?: string
  maxInsights?: number
}

const getGeminiModel = (apiKey: string) => {
  if (!apiKey.trim()) {
    throw new Error('Please add a MintAI API key in Settings first.')
  }

  const genAI = new GoogleGenerativeAI(apiKey.trim())
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
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

export const validateGeminiKey = async (apiKey: string) => {
  try {
    const model = getGeminiModel(apiKey)
    await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: 'Reply with OK' }] }],
      generationConfig: { maxOutputTokens: 2 },
    })
    return true
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : 'Gemini API key is invalid or was rejected.'
    throw new Error(message)
  }
}

export const predictWithGemini = async ({
  apiKey,
  timeframe,
  currency,
  transactions,
  subscriptions,
}: PredictionInput) => {
  const model = getGeminiModel(apiKey)

  const prompt = `
You are a financial forecaster. Based on the history below, forecast expenses for the timeframe "${timeframe}" in ${currency}.
Keep it concise, list 3-5 insights, highlight risky categories, and end with a single line starting with "Estimated total:" followed by a number only (no currency symbol).

Transactions:
${formatTransactions(transactions)}

Subscriptions:
${formatSubscriptions(subscriptions)}
`

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  const match = text.match(/Estimated total:\s*([\d.,]+)/i)
  const totalEstimate = match ? Number(match[1].replace(/,/g, '')) : undefined

  return {
    summary: text,
    totalEstimate,
  }
}

export const categorizeExpenseWithGemini = async ({
  apiKey,
  amount,
  currency,
  source,
  notes,
  categories,
}: CategorizeExpenseInput) => {
  const model = getGeminiModel(apiKey)
  const prompt = `
You help categorize personal finance expenses. Use only this category list: ${categories.join(
    ', ',
  )}.
Return a single JSON object exactly like {"category":"OneOfTheAbove"} with no markdown.

Expense details:
- Merchant/Source: ${source}
- Amount: ${amount} ${currency}
- Notes: ${notes?.trim() || 'None provided'}
`

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 30 },
  })

  const text = result.response.text()
  return extractCategory(text, categories)
}

export const generateSpendingInsights = async ({
  apiKey,
  currency,
  transactions,
  subscriptions,
  lookbackLabel,
  firstName,
  maxInsights = 6,
}: SpendingInsightsInput) => {
  const model = getGeminiModel(apiKey)

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

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 400 },
  })

  const text = result.response.text().trim()
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length)

  const bullets = lines
    .map((line) => line.replace(/^[\-\u2022•\d.]+\s*/, '').trim())
    .filter((line) => line.length)

  return bullets.length ? bullets.slice(0, maxInsights) : [text]
}
