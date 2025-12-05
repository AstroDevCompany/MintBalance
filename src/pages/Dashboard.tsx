import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, PiggyBank, Sparkles } from 'lucide-react'
import { buildMonthlySeries, calculateTotals, categoryBreakdown, formatCurrency, subscriptionMonthlyTotal, upcomingRenewals } from '../lib/finance'
import { useFinanceStore } from '../store/useFinanceStore'
import { CashflowChart } from '../components/CashflowChart'
import { CategoryPie } from '../components/CategoryPie'
import { SummaryCard } from '../components/SummaryCard'
import { PredictionPanel } from '../components/PredictionPanel'

export const Dashboard = () => {
  const transactions = useFinanceStore((s) => s.transactions)
  const subscriptions = useFinanceStore((s) => s.subscriptions)
  const { currency, firstName } = useFinanceStore((s) => s.settings)
  const [showIncome, setShowIncome] = useState(true)
  const [showExpense, setShowExpense] = useState(true)
  const [breakdownKind, setBreakdownKind] = useState<'income' | 'expense'>('expense')

  const totals = useMemo(() => calculateTotals(transactions), [transactions])
  const monthlySeries = useMemo(() => buildMonthlySeries(transactions, 6), [transactions])
  const incomeBreakdown = useMemo(
    () => categoryBreakdown(transactions, 'income'),
    [transactions],
  )
  const expenseBreakdown = useMemo(
    () => categoryBreakdown(transactions, 'expense'),
    [transactions],
  )
  const breakdownData =
    breakdownKind === 'income' ? incomeBreakdown : expenseBreakdown
  const renewals = useMemo(() => upcomingRenewals(subscriptions).slice(0, 3), [subscriptions])

  const monthlySubs = useMemo(
    () => subscriptionMonthlyTotal(subscriptions),
    [subscriptions],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.35em] text-teal-300">Overview</p>
        <h1 className="text-3xl font-bold text-white">
          {firstName ? `Welcome back, ${firstName}` : 'Welcome to MintBalance'}
        </h1>
        <p className="text-sm text-slate-300">
          Track incomes, expenses, and subscriptions with a calm, minimal cockpit.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Balance"
          value={formatCurrency(totals.balance, currency)}
          helper="Income minus expenses"
          accent="emerald"
          icon={<PiggyBank size={20} />}
        />
        <SummaryCard
          title="Income"
          value={formatCurrency(totals.incomeTotal, currency)}
          helper="Logged this period"
          accent="teal"
          icon={<ArrowUpRight size={20} />}
        />
        <SummaryCard
          title="Expenses"
          value={formatCurrency(totals.expenseTotal, currency)}
          helper="Spending logged"
          accent="cyan"
          icon={<ArrowDownRight size={20} />}
        />
        <SummaryCard
          title="Subscriptions"
          value={formatCurrency(monthlySubs, currency)}
          helper="Active monthly burn"
          accent="emerald"
          icon={<Sparkles size={20} />}
          footer={
            renewals.length > 0 ? (
              <span className="text-xs text-slate-200">
                {renewals.length} renewals in the next 45 days
              </span>
            ) : (
              <span className="text-xs text-slate-300">No upcoming renewals</span>
            )
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Cashflow</p>
              <p className="text-lg font-semibold text-white">Income vs expenses</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowIncome((prev) => !prev)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  showIncome
                    ? 'bg-emerald-400/15 text-emerald-200'
                    : 'bg-white/5 text-slate-300'
                }`}
              >
                Income
              </button>
              <button
                onClick={() => setShowExpense((prev) => !prev)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  showExpense
                    ? 'bg-cyan-400/15 text-cyan-200'
                    : 'bg-white/5 text-slate-300'
                }`}
              >
                Expense
              </button>
            </div>
          </div>
          <CashflowChart
            data={monthlySeries}
            showIncome={showIncome}
            showExpense={showExpense}
            currency={currency}
          />
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Breakdown</p>
              <p className="text-lg font-semibold text-white">
                {breakdownKind === 'income' ? 'Income sources' : 'Expense types'}
              </p>
            </div>
            <div className="flex gap-2">
              {(['income', 'expense'] as const).map((kind) => (
                <button
                  key={kind}
                  onClick={() => setBreakdownKind(kind)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    breakdownKind === kind
                      ? 'bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 text-slate-900'
                      : 'bg-white/5 text-slate-200'
                  }`}
                >
                  {kind}
                </button>
              ))}
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={breakdownKind}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              {breakdownData.length ? (
                <CategoryPie data={breakdownData} currency={currency} />
              ) : (
                <p className="mt-4 text-sm text-slate-300">
                  Add {breakdownKind} records to see category distribution.
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Latest</p>
              <p className="text-lg font-semibold text-white">Recent activity</p>
            </div>
          </div>
          <div className="mt-3 space-y-3">
            {transactions.slice(0, 5).map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{tx.source}</p>
                  <p className="text-xs text-slate-400">
                    {tx.category} — {tx.date}
                  </p>
                </div>
                <span
                  className={`text-sm font-bold ${
                    tx.type === 'income' ? 'text-emerald-200' : 'text-cyan-200'
                  }`}
                >
                  {tx.type === 'income' ? '+' : '-'}
                  {formatCurrency(tx.amount, currency)}
                </span>
              </div>
            ))}
            {!transactions.length && (
              <p className="text-sm text-slate-300">
                Start by adding an income or expense to see them here.
              </p>
            )}
          </div>
        </div>
        <PredictionPanel />
      </div>
    </div>
  )
}
