import {
  differenceInCalendarDays,
  endOfMonth,
  format,
  isAfter,
  parseISO,
  startOfMonth,
  subMonths,
} from 'date-fns'
import type { Subscription, Transaction, TransactionKind } from '../types'

export const formatCurrency = (value: number, currency: string) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value)

export const calculateTotals = (transactions: Transaction[]) => {
  const incomeTotal = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0)

  const expenseTotal = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0)

  return {
    incomeTotal,
    expenseTotal,
    balance: incomeTotal - expenseTotal,
  }
}

export const buildMonthlySeries = (transactions: Transaction[], months = 6) => {
  const now = new Date()
  const series = []

  for (let i = months - 1; i >= 0; i -= 1) {
    const monthStart = startOfMonth(subMonths(now, i))
    const monthEnd = endOfMonth(monthStart)
    const monthTransactions = transactions.filter((t) => {
      const date = parseISO(t.date)
      return !isAfter(date, monthEnd) && !isAfter(monthStart, date)
    })

    const income = monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((acc, curr) => acc + curr.amount, 0)
    const expense = monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, curr) => acc + curr.amount, 0)

    series.push({
      month: format(monthStart, 'MMM'),
      income,
      expense,
      net: income - expense,
    })
  }

  return series
}

export const categoryBreakdown = (
  transactions: Transaction[],
  kind: TransactionKind,
) => {
  const filtered = transactions.filter((t) => t.type === kind)
  const byCategory: Record<string, number> = {}

  filtered.forEach((t) => {
    byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount
  })

  return Object.entries(byCategory).map(([name, value]) => ({ name, value }))
}

const frequencyToMonthly = (frequency: string, amount: number) => {
  switch (frequency) {
    case 'weekly':
      return amount * 4.345
    case 'quarterly':
      return amount / 3
    case 'annual':
      return amount / 12
    default:
      return amount
  }
}

export const subscriptionMonthlyTotal = (subscriptions: Subscription[]) =>
  subscriptions
    .filter((s) => s.active)
    .reduce((acc, sub) => acc + frequencyToMonthly(sub.frequency, sub.amount), 0)

export const upcomingRenewals = (subscriptions: Subscription[]) =>
  subscriptions
    .filter((s) => s.active)
    .filter((s) => {
      const next = parseISO(s.nextPayment)
      const days = differenceInCalendarDays(next, new Date())
      return days >= 0 && days <= 45
    })
    .sort(
      (a, b) => parseISO(a.nextPayment).getTime() - parseISO(b.nextPayment).getTime(),
    )
