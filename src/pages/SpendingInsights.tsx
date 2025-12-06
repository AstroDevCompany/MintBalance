import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Clock3, Info, Loader2, Sparkles } from 'lucide-react'
import { formatCurrency } from '../lib/finance'
import { generateSpendingInsightsAi } from '../lib/ai'
import { useFinanceStore } from '../store/useFinanceStore'

const lookbackOptions = [
  { id: '30', label: 'Last 30 days', days: 30 },
  { id: '60', label: 'Last 60 days', days: 60 },
  { id: '90', label: 'Last 90 days', days: 90 },
] as const

export const SpendingInsights = () => {
  const transactions = useFinanceStore((s) => s.transactions)
  const subscriptions = useFinanceStore((s) => s.subscriptions)
  const { geminiApiKey, geminiKeyValid, currency, firstName, aiMode = 'cloud', localModelReady } =
    useFinanceStore((s) => s.settings)
  const [lookback, setLookback] = useState<(typeof lookbackOptions)[number]['days']>(60)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [insights, setInsights] = useState<string[]>([])
  const [lastRun, setLastRun] = useState<string | null>(null)

  const cutoff = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - lookback)
    return d
  }, [lookback])

  const expenses = useMemo(
    () =>
      transactions.filter(
        (t) => t.type === 'expense' && new Date(t.date).getTime() >= cutoff.getTime(),
      ),
    [transactions, cutoff],
  )

  const expenseTotal = useMemo(
    () => expenses.reduce((acc, curr) => acc + curr.amount, 0),
    [expenses],
  )

  const topCategory = useMemo(() => {
    const counts: Record<string, number> = {}
    expenses.forEach((t) => {
      counts[t.category] = (counts[t.category] ?? 0) + t.amount
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A'
  }, [expenses])

  const handleGenerate = async () => {
    const cloudNotReady = !geminiApiKey || !geminiKeyValid
    const localNotReady = !localModelReady
    if ((aiMode === 'cloud' && cloudNotReady) || (aiMode === 'local' && localNotReady)) {
      setError(
        aiMode === 'local'
          ? 'Download the local model in Settings to enable MintAI insights.'
          : 'Add and validate a Gemini API key in Settings to enable MintAI insights.',
      )
      return
    }

    if (!expenses.length && !subscriptions.length) {
      setError('Add some expenses or subscriptions first so MintAI has data to analyze.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const lookbackLabel = lookbackOptions.find((o) => o.days === lookback)?.label ?? 'Recent'
      const result = await generateSpendingInsightsAi(
        aiMode === 'local'
          ? {
              mode: 'local',
              apiKey: '',
              currency,
              transactions: expenses,
              subscriptions,
              lookbackLabel,
              firstName,
              maxInsights: 6,
            }
          : {
              mode: 'cloud',
              apiKey: geminiApiKey,
              currency,
              transactions: expenses,
              subscriptions,
              lookbackLabel,
              firstName,
              maxInsights: 6,
            },
      )
      setInsights(result)
      setLastRun(new Date().toISOString())
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'MintAI could not generate insights right now.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.3em] text-teal-300">Intelligence</p>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-white">Spending Insights</h2>
          <Sparkles className="text-emerald-200" size={18} />
        </div>
        <p className="text-sm text-slate-300">
          Let MintAI scan your recent expenses to surface high-signal insights about your spending.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Lookback</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {lookbackOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setLookback(opt.days)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  lookback === opt.days
                    ? 'bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 text-slate-900'
                    : 'bg-white/5 text-slate-200 hover:bg-white/10'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Analyses use expenses in this window; subscriptions are always included.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Spend in window</p>
          <p className="mt-2 text-2xl font-bold text-emerald-200">
            {formatCurrency(expenseTotal, currency)}
          </p>
          <p className="text-xs text-slate-400">
            From {expenses.length} expense{expenses.length === 1 ? '' : 's'} logged.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Top category</p>
          <p className="mt-2 text-2xl font-bold text-cyan-200">{topCategory}</p>
          {lastRun && (
            <p className="text-xs text-slate-400">
              Last generated {new Date(lastRun).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-white">
            <Sparkles size={18} className="text-emerald-200" />
            <div>
              <p className="text-sm font-semibold">MintAI insights</p>
              <p className="text-xs text-slate-300">
                High-signal notes across categories, anomalies, merchants, and forecasts.
              </p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow-glow transition hover:brightness-105 disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {loading ? 'Thinking...' : 'Generate with MintAI'}
          </motion.button>
        </div>

        {aiMode === 'cloud' && (!geminiApiKey || !geminiKeyValid) ? (
          <div className="flex items-center gap-2 rounded-xl border border-amber-300/30 bg-amber-500/10 p-3 text-sm text-amber-100">
            <Info size={16} />
            Add and validate a Gemini API key in Settings to unlock AI spending insights.
          </div>
        ) : null}
        {aiMode === 'local' && !localModelReady ? (
          <div className="flex items-center gap-2 rounded-xl border border-amber-300/30 bg-amber-500/10 p-3 text-sm text-amber-100">
            <Info size={16} />
            Download the local model in Settings to unlock offline spending insights.
          </div>
        ) : null}

        {error && <p className="text-sm text-rose-200">{error}</p>}

        <div className="grid gap-3 md:grid-cols-2">
          {insights.length ? (
            insights.map((insight, idx) => (
              <div
                key={`${insight}-${idx}`}
                className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-slate-100"
              >
                <p className="font-semibold text-white">Insight {idx + 1}</p>
                <p className="mt-1 text-slate-200">{insight}</p>
              </div>
            ))
          ) : (
            <div className="col-span-2 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
              No insights yet. Set a lookback window and run MintAI to see spending callouts.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl text-sm text-slate-200">
        <div className="flex items-center gap-2 text-white">
          <Clock3 size={16} className="text-cyan-200" />
          <p className="font-semibold">What you can expect</p>
        </div>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-300">
          <li>Category comparisons and trend shifts (e.g., food up vs. last month).</li>
          <li>Merchant highlights and recurring payment changes.</li>
          <li>Behavior patterns, anomalies, and budget/forecast nudges.</li>
        </ul>
      </div>
    </div>
  )
}
