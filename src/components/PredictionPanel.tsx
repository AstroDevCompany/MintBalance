import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Wand2 } from 'lucide-react'
import { predictExpensesAi } from '../lib/ai'
import { formatCurrency } from '../lib/finance'
import { useFinanceStore } from '../store/useFinanceStore'

const presets = [
  { id: '7', label: '7 days' },
  { id: '30', label: '30 days' },
  { id: '90', label: '90 days' },
  { id: '180', label: '180 days' },
  { id: 'custom', label: 'Custom' },
] as const

export const PredictionPanel = () => {
  const transactions = useFinanceStore((s) => s.transactions)
  const subscriptions = useFinanceStore((s) => s.subscriptions)
  const { geminiApiKey, geminiKeyValid, currency, aiMode = 'cloud', localModelReady } =
    useFinanceStore((s) => s.settings)
  const [selected, setSelected] = useState<(typeof presets)[number]['id']>('90')
  const [customDays, setCustomDays] = useState(45)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ summary: string; totalEstimate?: number } | null>(null)

  const timeframe = useMemo(() => {
    if (selected === 'custom') {
      return `next ${customDays} days`
    }
    return `next ${selected} days`
  }, [customDays, selected])

  const handlePredict = async () => {
    const cloudNotReady = !geminiApiKey || !geminiKeyValid
    const localNotReady = !localModelReady
    if ((aiMode === 'cloud' && cloudNotReady) || (aiMode === 'local' && localNotReady)) {
      setError(
        aiMode === 'local'
          ? 'Download and ready the local model in Settings to use MintAI.'
          : 'Add and validate a Gemini API key in Settings to use MintAI.',
      )
      return
    }

    setLoading(true)
    setError(null)
    try {
      const prediction = await predictExpensesAi(
        aiMode === 'local'
          ? {
              mode: 'local',
              apiKey: '',
              timeframe,
              currency,
              transactions,
              subscriptions,
            }
          : {
              mode: 'cloud',
              apiKey: geminiApiKey,
              timeframe,
              currency,
              transactions,
              subscriptions,
            },
      )
      setResult(prediction)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'MintAI was unable to process the request.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Forecast</p>
          <p className="text-lg font-semibold text-white">MintAI expense insight</p>
        </div>
        <Wand2 className="text-emerald-200" size={18} />
      </div>
      <div className="mt-3 space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Timeframe</p>
        <div className="flex flex-wrap gap-2">
          {presets.map((opt) => {
            const isActive = selected === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelected(opt.id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 text-slate-900'
                    : 'bg-white/5 text-slate-200 hover:bg-white/10'
                }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
        {selected === 'custom' && (
          <div className="flex items-center gap-2 text-sm text-slate-200">
            <input
              type="number"
              min={1}
              value={customDays}
              onChange={(e) =>
                setCustomDays(Math.max(1, Number(e.target.value) || 1))
              }
              className="w-24 rounded-xl border border-white/10 bg-[#0b1625] px-3 py-2 text-white outline-none transition focus:border-teal-300 focus:bg-white/10"
            />
            <span>days</span>
          </div>
        )}
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={handlePredict}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow-glow transition hover:brightness-105 disabled:opacity-60"
        >
          <Wand2 size={16} />
          {loading ? 'Thinking...' : 'Predict with MintAI'}
        </motion.button>
      </div>
      {((aiMode === 'cloud' && (!geminiApiKey || !geminiKeyValid)) ||
        (aiMode === 'local' && !localModelReady)) && (
        <p className="mt-3 text-sm text-amber-200">
          {aiMode === 'local'
            ? 'Download the local model in Settings to enable offline AI projections.'
            : 'Add and validate a MintAI API key in Settings to enable AI projections.'}
        </p>
      )}
      {error && <p className="mt-3 text-sm text-rose-200">{error}</p>}
      {result && (
        <div className="mt-4 space-y-2 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-slate-100">
          {result.totalEstimate !== undefined && (
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">
              Estimated total:{' '}
              <span className="text-base font-bold text-white">
                {formatCurrency(result.totalEstimate, currency)}
              </span>
            </p>
          )}
          <pre className="whitespace-pre-wrap font-sans text-sm text-slate-200">
            {result.summary}
          </pre>
        </div>
      )}
    </div>
  )
}
