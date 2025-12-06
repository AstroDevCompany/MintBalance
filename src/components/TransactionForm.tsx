import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { motion } from 'framer-motion'
import { PlusCircle, Sparkles } from 'lucide-react'
import { useFinanceStore } from '../store/useFinanceStore'
import type { TransactionKind } from '../types'
import { categorizeExpenseAi } from '../lib/ai'

const categories = {
  income: ['Salary', 'Bonus', 'Freelance', 'Investments', 'Other'],
  expense: ['Housing', 'Food', 'Transport', 'Entertainment', 'Health', 'Utilities', 'Tech', 'Other'],
}

const autoCategoryValue = '__auto__'

export const TransactionForm = () => {
  const addTransaction = useFinanceStore((s) => s.addTransaction)
  const { currency, geminiApiKey, geminiKeyValid, aiMode = 'cloud', localModelReady } =
    useFinanceStore((s) => s.settings)
  const [type, setType] = useState<TransactionKind>('income')
  const [source, setSource] = useState('')
  const [category, setCategory] = useState(categories.income[0])
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const aiEnabled =
    aiMode === 'local'
      ? Boolean(localModelReady)
      : Boolean(geminiApiKey && geminiKeyValid)

  useEffect(() => {
    if (type === 'expense') {
      if (!aiEnabled && category === autoCategoryValue) {
        setCategory(categories.expense[0])
      }
      if (aiEnabled && category !== autoCategoryValue) {
        setCategory(autoCategoryValue)
      }
    }
  }, [aiEnabled, category, type])

  const reset = () => {
    setSource('')
    setAmount('')
    setNotes('')
    setDate(new Date().toISOString().slice(0, 10))
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const parsed = Number(amount)
    if (!source.trim() || Number.isNaN(parsed) || parsed <= 0) return

    setSaving(true)
    try {
      let finalCategory = category
      const trimmedSource = source.trim()

      if (type === 'expense' && category === autoCategoryValue) {
        if (!aiEnabled) {
          throw new Error(
            aiMode === 'local'
              ? 'Local MintAI is not ready. Download the model first.'
              : 'MintAI is not enabled. Save a valid Gemini key in Settings first.',
          )
        }
        finalCategory = await categorizeExpenseAi({
          mode: aiMode,
          apiKey: geminiApiKey,
          amount: parsed,
          currency,
          source: trimmedSource,
          notes,
          categories: categories.expense,
        })
      }

      addTransaction({
        amount: parsed,
        category: finalCategory,
        date,
        notes,
        source: trimmedSource,
        type,
      })
      reset()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'MintAI could not categorize that expense.'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const toggleType = (next: TransactionKind) => {
    setType(next)
    if (next === 'expense' && aiEnabled) {
      setCategory(autoCategoryValue)
    } else {
      setCategory(categories[next][0])
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Add record</p>
          <p className="text-lg font-semibold text-white">Income & expenses</p>
        </div>
        <div className="flex gap-2 rounded-xl bg-white/5 p-1">
          {(['income', 'expense'] as TransactionKind[]).map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => toggleType(kind)}
              className={`rounded-lg px-3 py-1 text-sm font-semibold transition ${
                type === kind
                  ? 'bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 text-slate-900 shadow-glow'
                  : 'text-slate-200 hover:bg-white/10'
              }`}
            >
              {kind === 'income' ? 'Income' : 'Expense'}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-slate-200">
          Source
          <input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Company, client, vendor..."
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-teal-300 focus:bg-white/10"
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-200">
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-teal-300 focus:bg-white/10"
          >
            {categories[type].map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
            {type === 'expense' && aiEnabled && (
              <option value={autoCategoryValue}>Auto (MintAI)</option>
            )}
          </select>
          {type === 'expense' && aiEnabled && (
            <p className="flex items-center gap-2 text-xs text-emerald-200">
              <Sparkles size={14} /> MintAI will auto-categorize when you pick Auto.
            </p>
          )}
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-200">
          Amount
          <input
            value={amount}
            type="number"
            inputMode="decimal"
            step="0.01"
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-teal-300 focus:bg-white/10"
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-200">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-teal-300 focus:bg-white/10"
            required
          />
        </label>
      </div>
      <label className="mt-3 block text-sm text-slate-200">
        Notes
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Optional context, tags, ids..."
          className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-teal-300 focus:bg-white/10"
        />
      </label>
      <div className="mt-4 flex justify-end">
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow-glow transition hover:brightness-105 disabled:opacity-60"
        >
          <PlusCircle size={16} />
          {saving ? 'Saving...' : `Save ${type}`}
        </motion.button>
      </div>
      {error && <p className="mt-2 text-sm text-rose-200">{error}</p>}
    </form>
  )
}
