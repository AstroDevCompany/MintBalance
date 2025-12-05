import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Sparkles, Trash2 } from 'lucide-react'
import { open } from '@tauri-apps/api/shell'
import { useFinanceStore } from '../store/useFinanceStore'
import { useUpdateCheck } from '../hooks/useUpdateCheck'
import { AuthPanel } from '../components/AuthPanel'

const currencies = ['USD', 'EUR', 'GBP', 'CHF', 'CAD', 'AUD']

export const Settings = () => {
  const { currency, geminiApiKey, firstName } = useFinanceStore((s) => s.settings)
  const updateSettings = useFinanceStore((s) => s.updateSettings)
  const clearAll = useFinanceStore((s) => s.clearAll)
  const [apiKey, setApiKey] = useState(geminiApiKey)
  const appVersion = import.meta.env.VITE_APP_VERSION ?? '1.0.0'
  const { available, latestVersion } = useUpdateCheck(appVersion)

  const handleClear = () => {
    if (
      window.confirm(
        'Clear all data? This removes transactions, subscriptions, and settings.',
      )
    ) {
      clearAll()
    }
  }

  const handleApiSave = () => updateSettings({ geminiApiKey: apiKey.trim() })

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-teal-300">Control</p>
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <p className="text-sm text-slate-300">
          Set your name, currency, MintAI key, and wipe data when needed.
        </p>
      </div>

      {available && (
        <div className="rounded-2xl border border-emerald-200/30 bg-gradient-to-r from-emerald-400/10 via-cyan-400/10 to-teal-400/10 p-4 shadow-glow flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-teal-200">Update available</p>
            <p className="text-sm text-slate-100">
              You are on <span className="font-semibold text-white">{appVersion}</span>. Latest:{' '}
              <span className="font-semibold text-white">{latestVersion ?? 'unknown'}</span>.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => open('https://mintflow.dev/products')}
              className="rounded-xl bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow-glow transition hover:brightness-105"
            >
              Download now
            </button>
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/5"
            >
              Refresh
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Shield size={16} /> Personalization
          </div>
          <label className="text-sm text-slate-200">
            First name
            <input
              value={firstName}
              onChange={(e) => updateSettings({ firstName: e.target.value })}
              placeholder="Alex"
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-teal-300 focus:bg-white/10"
            />
          </label>
          <label className="text-sm text-slate-200">
            Currency
            <select
              value={currency}
              onChange={(e) => updateSettings({ currency: e.target.value })}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b1625] px-3 py-2 text-white outline-none transition focus:border-teal-300 focus:bg-white/10"
            >
              {currencies.map((cur) => (
                <option key={cur}>{cur}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Sparkles size={16} /> MintAI
          </div>
          <label className="text-sm text-slate-200">
            Gemini API key
            <input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your Gemini API key"
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-teal-300 focus:bg-white/10"
            />
          </label>
          <div className="flex justify-end">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleApiSave}
              className="rounded-xl bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow-glow transition hover:brightness-105"
            >
              Save API key
            </motion.button>
          </div>
          <p className="text-xs text-slate-400">
            Optional. Used to forecast expenses from your ledger and subscriptions.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-rose-300">Danger zone</p>
            <p className="text-xs text-slate-300">
              Clears every saved record, subscription, and setting.
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleClear}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:border-rose-300 hover:text-white"
          >
            <Trash2 size={16} />
            Clear all data
          </motion.button>
        </div>
      </div>

      <AuthPanel />
    </div>
  )
}
