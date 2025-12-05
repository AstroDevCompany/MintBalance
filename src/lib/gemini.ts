import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Subscription, Transaction } from '../types'

type PredictionInput = {
  apiKey: string
  timeframe: string
  currency: string
  transactions: Transaction[]
  subscriptions: Subscription[]
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

export const predictWithGemini = async ({
  apiKey,
  timeframe,
  currency,
  transactions,
  subscriptions,
}: PredictionInput) => {
  if (!apiKey) {
    throw new Error('Please add a MintAI API key in Settings first.')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

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
