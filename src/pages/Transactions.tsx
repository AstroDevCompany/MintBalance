import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { calculateTotals, formatCurrency } from '../lib/finance'
import { useFinanceStore } from '../store/useFinanceStore'
import { TransactionForm } from '../components/TransactionForm'
import { TransactionsTable } from '../components/TransactionsTable'

export const Transactions = () => {
  const transactions = useFinanceStore((s) => s.transactions)
  const currency = useFinanceStore((s) => s.settings.currency)
  const totals = calculateTotals(transactions)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-teal-300">Records</p>
        <h2 className="text-2xl font-bold text-white">Transactions</h2>
        <p className="text-sm text-slate-300">
          Add incomes and expenses, tag them, and keep the ledger clean.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl">
          <p className="text-sm font-semibold text-white">Income this period</p>
          <div className="mt-2 flex items-center gap-2 text-2xl font-bold text-emerald-200">
            <ArrowUpRight size={18} /> {formatCurrency(totals.incomeTotal, currency)}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl">
          <p className="text-sm font-semibold text-white">Expenses this period</p>
          <div className="mt-2 flex items-center gap-2 text-2xl font-bold text-cyan-200">
            <ArrowDownRight size={18} /> {formatCurrency(totals.expenseTotal, currency)}
          </div>
        </div>
      </div>

      <TransactionForm />
      <TransactionsTable currency={currency} />
    </div>
  )
}
