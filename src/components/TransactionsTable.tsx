import { Check, Trash2, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { format } from 'date-fns'
import { useState } from 'react'
import { useFinanceStore } from '../store/useFinanceStore'
import { formatCurrency } from '../lib/finance'

type Props = {
  currency: string
}

export const TransactionsTable = ({ currency }: Props) => {
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const transactions = useFinanceStore((s) => s.transactions)
  const removeTransaction = useFinanceStore((s) => s.removeTransaction)

  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )

  if (!sorted.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
        Nothing logged yet. Add your first income or expense to start tracking.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-xl">
      <div className="grid grid-cols-12 gap-3 px-4 py-2 text-xs uppercase tracking-wide text-slate-400">
        <div className="col-span-3">Item</div>
        <div className="col-span-2">Category</div>
        <div className="col-span-2">Type</div>
        <div className="col-span-2">Date</div>
        <div className="col-span-2 text-right">Amount</div>
        <div className="col-span-1"></div>
      </div>
      <div className="divide-y divide-white/5">
        {sorted.map((tx) => (
          <div
            key={tx.id}
            className="grid grid-cols-12 gap-3 px-4 py-3 text-sm text-slate-100 hover:bg-white/5"
          >
            <div className="col-span-3">
              <p className="font-semibold">{tx.source}</p>
              {tx.notes && <p className="text-xs text-slate-400">{tx.notes}</p>}
            </div>
            <div className="col-span-2 text-slate-200">{tx.category}</div>
            <div className="col-span-2">
              <span
                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                  tx.type === 'income'
                    ? 'bg-emerald-400/15 text-emerald-200'
                    : 'bg-cyan-400/15 text-cyan-200'
                }`}
              >
                {tx.type}
              </span>
            </div>
            <div className="col-span-2 text-slate-300">
              {format(new Date(tx.date), 'PP')}
            </div>
            <div
              className={`col-span-2 text-right font-semibold ${
                tx.type === 'income' ? 'text-emerald-200' : 'text-cyan-200'
              }`}
            >
              {tx.type === 'income' ? '+' : '-'}
              {formatCurrency(tx.amount, currency)}
            </div>
            <div className="col-span-1 flex justify-end">
              <AnimatePresence mode="wait" initial={false}>
                {pendingDelete === tx.id ? (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="flex gap-2"
                  >
                    <button
                      onClick={() => {
                        removeTransaction(tx.id)
                        setPendingDelete(null)
                      }}
                      className="rounded-lg p-2 text-emerald-200 transition hover:bg-white/10 hover:text-emerald-100"
                      aria-label="Confirm delete transaction"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => setPendingDelete(null)}
                      className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                      aria-label="Cancel delete transaction"
                    >
                      <X size={16} />
                    </button>
                  </motion.div>
                ) : (
                  <motion.button
                    key="trash"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => setPendingDelete(tx.id)}
                    className="rounded-lg p-2 text-rose-300 transition hover:bg-white/10 hover:text-rose-200"
                    aria-label="Delete transaction"
                  >
                    <Trash2 size={16} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
