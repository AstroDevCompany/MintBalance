import { differenceInCalendarDays, format } from 'date-fns'
import { Check, CheckCircle2, Pause, Trash2, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { useFinanceStore } from '../store/useFinanceStore'
import { formatCurrency, subscriptionMonthlyTotal } from '../lib/finance'

type Props = {
  currency: string
}

export const SubscriptionsList = ({ currency }: Props) => {
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const subscriptions = useFinanceStore((s) => s.subscriptions)
  const toggleSubscription = useFinanceStore((s) => s.toggleSubscription)
  const removeSubscription = useFinanceStore((s) => s.removeSubscription)

  if (!subscriptions.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
        No subscriptions yet. Track recurring costs to keep burn predictable.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-slate-300">
        <p>
          Active monthly burn:{' '}
          <span className="font-semibold text-teal-200">
            {formatCurrency(subscriptionMonthlyTotal(subscriptions), currency)}
          </span>
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {subscriptions.map((sub) => {
          const daysLeft = differenceInCalendarDays(new Date(sub.nextPayment), new Date())
          const dueSoon = daysLeft >= 0 && daysLeft <= 14
          return (
            <div
              key={sub.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-white">{sub.name}</p>
                  <p className="text-sm text-slate-300">{sub.category}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    sub.active
                      ? 'bg-emerald-400/15 text-emerald-200'
                      : 'bg-white/10 text-slate-300'
                  }`}
                >
                  {sub.frequency}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <div className="space-y-1 text-slate-200">
                  <p>
                    Next payment:{' '}
                    <span className="font-semibold text-white">
                      {format(new Date(sub.nextPayment), 'PP')}
                    </span>
                  </p>
                  <p className="text-slate-300">
                    {sub.notes || 'Keep an eye on this renewal.'}
                  </p>
                </div>
                <div className="text-right text-xl font-bold text-white">
                  {formatCurrency(sub.amount, currency)}
                  <p className="text-xs text-slate-400">per {sub.frequency}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  {dueSoon ? (
                    <span className="rounded-full bg-cyan-400/15 px-2 py-1 text-cyan-200">
                      Due in {daysLeft}d
                    </span>
                  ) : (
                    <span className="rounded-full bg-white/5 px-2 py-1">
                      {daysLeft > 0 ? `${daysLeft} days out` : 'Past due'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleSubscription(sub.id)}
                    className="rounded-lg bg-white/5 px-3 py-2 text-slate-200 transition hover:bg-white/10"
                  >
                    {sub.active ? (
                      <span className="inline-flex items-center gap-1">
                        <Pause size={14} /> Pause
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 size={14} /> Resume
                      </span>
                    )}
                  </button>
                  {pendingDelete === sub.id ? (
                    <AnimatePresence mode="wait" initial={false}>
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
                            removeSubscription(sub.id)
                            setPendingDelete(null)
                          }}
                          className="rounded-lg bg-white/5 px-3 py-2 text-emerald-200 transition hover:bg-white/10"
                          aria-label="Confirm delete subscription"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setPendingDelete(null)}
                          className="rounded-lg bg-white/5 px-3 py-2 text-slate-200 transition hover:bg-white/10"
                          aria-label="Cancel delete subscription"
                        >
                          <X size={14} />
                        </button>
                      </motion.div>
                    </AnimatePresence>
                  ) : (
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.button
                        key="trash"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => setPendingDelete(sub.id)}
                        className="rounded-lg bg-white/5 px-3 py-2 text-rose-300 transition hover:bg-white/10 hover:text-rose-200"
                        aria-label="Delete subscription"
                      >
                        <Trash2 size={14} />
                      </motion.button>
                    </AnimatePresence>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
