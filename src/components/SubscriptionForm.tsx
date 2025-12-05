import { useState } from 'react'
import type { FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Plus } from 'lucide-react'
import { useFinanceStore } from '../store/useFinanceStore'
import type { SubscriptionFrequency } from '../types'

const frequencies: SubscriptionFrequency[] = ['weekly', 'monthly', 'quarterly', 'annual']

export const SubscriptionForm = () => {
  const addSubscription = useFinanceStore((s) => s.addSubscription)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState<SubscriptionFrequency>('monthly')
  const [nextPayment, setNextPayment] = useState(() =>
    new Date().toISOString().slice(0, 10),
  )
  const [category, setCategory] = useState('General')
  const [notes, setNotes] = useState('')

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const parsed = Number(amount)
    if (!name.trim() || Number.isNaN(parsed) || parsed <= 0) return

    addSubscription({
      name: name.trim(),
      amount: parsed,
      frequency,
      nextPayment,
      category,
      notes,
      active: true,
    })

    setName('')
    setAmount('')
    setNotes('')
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl"
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Subscriptions
          </p>
          <p className="text-lg font-semibold text-white">Add recurring cost</p>
        </div>
        <Calendar className="text-cyan-300" size={18} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-slate-200">
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Notion, Netflix, Gym..."
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-teal-300 focus:bg-white/10"
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-200">
          Category
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Productivity, Entertainment..."
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-teal-300 focus:bg-white/10"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-200">
          Amount
          <input
            value={amount}
            type="number"
            inputMode="decimal"
            step="0.01"
            onChange={(e) => setAmount(e.target.value)}
            placeholder="12.00"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-teal-300 focus:bg-white/10"
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-200">
          Frequency
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as SubscriptionFrequency)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-teal-300 focus:bg-white/10"
          >
            {frequencies.map((freq) => (
              <option key={freq}>{freq}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-200">
          Next payment
          <input
            type="date"
            value={nextPayment}
            onChange={(e) => setNextPayment(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-teal-300 focus:bg-white/10"
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-200 md:col-span-2">
          Notes
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Renewal reminders, negotiable price, etc."
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-teal-300 focus:bg-white/10"
          />
        </label>
      </div>
      <div className="mt-4 flex justify-end">
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow-glow transition hover:brightness-105"
        >
          <Plus size={16} />
          Save subscription
        </motion.button>
      </div>
    </form>
  )
}
