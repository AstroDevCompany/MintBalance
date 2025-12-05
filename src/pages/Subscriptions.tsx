import { CalendarClock, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { SubscriptionForm } from '../components/SubscriptionForm'
import { SubscriptionsList } from '../components/SubscriptionsList'
import { formatCurrency, subscriptionMonthlyTotal, upcomingRenewals } from '../lib/finance'
import { useFinanceStore } from '../store/useFinanceStore'

export const Subscriptions = () => {
  const subscriptions = useFinanceStore((s) => s.subscriptions)
  const currency = useFinanceStore((s) => s.settings.currency)

  const monthly = subscriptionMonthlyTotal(subscriptions)
  const renewals = upcomingRenewals(subscriptions)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-teal-300">Recurring</p>
        <h2 className="text-2xl font-bold text-white">Subscriptions</h2>
        <p className="text-sm text-slate-300">
          Stay ahead of renewals and recurring costs with a monthly burn view.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl">
          <p className="text-sm font-semibold text-white">Monthly burn</p>
          <div className="mt-2 flex items-center gap-2 text-2xl font-bold text-emerald-200">
            <TrendingUp size={18} />
            {formatCurrency(monthly, currency)}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Converted from weekly/quarterly/annual cadences.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl">
          <p className="text-sm font-semibold text-white">Upcoming renewals</p>
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-200">
            {renewals.slice(0, 3).map((sub) => (
              <span
                key={sub.id}
                className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1"
              >
                <CalendarClock size={14} />
                {sub.name} — {format(new Date(sub.nextPayment), 'PP')}
              </span>
            ))}
            {!renewals.length && <span>No renewals in the next 45 days.</span>}
          </div>
        </div>
      </div>

      <SubscriptionForm />
      <SubscriptionsList currency={currency} />
    </div>
  )
}
