import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Sparkles, Trash2 } from 'lucide-react'
import { open } from '@tauri-apps/api/shell'
import { useFinanceStore } from '../store/useFinanceStore'
import { useUpdateCheck } from '../hooks/useUpdateCheck'
import { AuthPanel } from '../components/AuthPanel'
import { validateGeminiKey } from '../lib/gemini'
import { LocalModelDialog } from '../components/LocalModelDialog'
import { getModelStatus, removeModel } from '../lib/localModel'

const currencies = ['USD', 'EUR', 'GBP', 'CHF', 'CAD', 'AUD']

export const Settings = () => {
  const { currency, geminiApiKey, geminiKeyValid, aiMode, localModelReady, firstName } =
    useFinanceStore((s) => s.settings)
  const updateSettings = useFinanceStore((s) => s.updateSettings)
  const clearAll = useFinanceStore((s) => s.clearAll)
  const [apiKey, setApiKey] = useState(geminiApiKey)
  const [apiStatus, setApiStatus] = useState<'idle' | 'checking' | 'valid' | 'error'>(
    geminiApiKey && geminiKeyValid ? 'valid' : 'idle',
  )
  const [apiMessage, setApiMessage] = useState<string | null>(null)
  const [aiChoice, setAiChoice] = useState<'cloud' | 'local'>(aiMode ?? 'cloud')
  const [localDialogOpen, setLocalDialogOpen] = useState(false)
  const appVersion = import.meta.env.VITE_APP_VERSION ?? '1.0.0'
  const { available, latestVersion } = useUpdateCheck(appVersion)

  useEffect(() => {
    setAiChoice(aiMode ?? 'cloud')
  }, [aiMode])

  const handleClear = () => {
    if (
      window.confirm(
        'Clear all data? This removes transactions, subscriptions, and settings.',
      )
    ) {
      clearAll()
    }
  }

  const handleApiSave = async () => {
    const trimmed = apiKey.trim()
    if (!trimmed) {
      updateSettings({
        geminiApiKey: '',
        geminiKeyValid: false,
        geminiKeyLastChecked: new Date().toISOString(),
      })
      setApiStatus('idle')
      setApiMessage(null)
      return
    }

    setApiStatus('checking')
    setApiMessage(null)
    try {
      await validateGeminiKey(trimmed)
      updateSettings({
        geminiApiKey: trimmed,
        geminiKeyValid: true,
        geminiKeyLastChecked: new Date().toISOString(),
      })
      setApiStatus('valid')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to verify your Gemini API key.'
      updateSettings({
        geminiApiKey: trimmed,
        geminiKeyValid: false,
        geminiKeyLastChecked: new Date().toISOString(),
      })
      setApiStatus('error')
      setApiMessage(message)
    }
  }

  const handleAiModeChange = async (mode: 'cloud' | 'local') => {
    if (mode === 'cloud') {
      setAiChoice('cloud')
      updateSettings({ aiMode: 'cloud' })
      return
    }

    const { exists, path } = await getModelStatus()
    if (!exists) {
      setLocalDialogOpen(true)
      return
    }
    setAiChoice('local')
    updateSettings({ aiMode: 'local', localModelReady: true, localModelPath: path })
  }

  const handleRemoveLocalModel = async () => {
    await removeModel()
    const status = await getModelStatus()
    updateSettings({
      aiMode: 'cloud',
      localModelReady: status.exists,
      localModelPath: status.path,
    })
    setAiChoice('cloud')
  }

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
          <div className="flex items-center justify-between gap-2 text-sm font-semibold text-white">
            <span className="inline-flex items-center gap-2">
              <Sparkles size={16} /> MintAI
            </span>
            <div className="flex gap-2 rounded-xl bg-white/5 p-1">
              {(['cloud', 'local'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleAiModeChange(mode)}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                    aiChoice === mode
                      ? 'bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 text-slate-900'
                      : 'text-slate-200 hover:bg-white/10'
                  }`}
                >
                  {mode === 'cloud' ? 'Cloud' : 'Local'}
                </button>
              ))}
            </div>
          </div>

          {aiChoice === 'cloud' && (
            <>
              <label className="text-sm text-slate-200">
                Gemini API key
                <input
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value)
                    setApiStatus('idle')
                    setApiMessage(null)
                  }}
                  placeholder="Paste your Gemini API key"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-teal-300 focus:bg-white/10"
                />
              </label>
              <div className="flex justify-end">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleApiSave}
                  disabled={apiStatus === 'checking'}
                  className="rounded-xl bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow-glow transition hover:brightness-105 disabled:opacity-60"
                >
                  {apiStatus === 'checking' ? 'Validating...' : 'Save API key'}
                </motion.button>
              </div>
              <p className="text-xs text-slate-400">
                Optional. Used to forecast expenses and auto-categorize new expenses via MintAI.
              </p>
              {apiMessage && <p className="text-sm text-rose-200">{apiMessage}</p>}
              {apiStatus === 'valid' && (
                <p className="text-xs text-emerald-200">
                  MintAI is enabled for expense auto-categorization.
                </p>
              )}
            </>
          )}

          {aiChoice === 'local' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-slate-200">
                <p className="font-semibold text-white">Local AI</p>
                <p className="text-xs text-slate-400">
                  Runs WizardLM locally for offline MintAI. Requires the GGUF model file. Current
                  status:{' '}
                  <span
                    className={`font-semibold ${
                      localModelReady ? 'text-emerald-200' : 'text-amber-200'
                    }`}
                  >
                    {localModelReady ? 'Model ready' : 'Model missing'}
                  </span>
                </p>
              </div>
              {localModelReady ? (
                <div className="flex flex-wrap gap-2">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleRemoveLocalModel}
                    className="inline-flex items-center gap-2 rounded-xl border border-rose-300/60 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20"
                  >
                    Remove local model
                  </motion.button>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setLocalDialogOpen(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow-glow transition hover:brightness-105"
                    >
                      Manage local model
                    </motion.button>
                    <button
                      onClick={() => handleAiModeChange('cloud')}
                      className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/5"
                    >
                      Switch back to cloud
                    </button>
                  </div>
                  <p className="text-xs text-amber-200">
                    Download or place the model before MintAI can run locally.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <AuthPanel />

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

      <LocalModelDialog
        open={localDialogOpen}
        onClose={() => setLocalDialogOpen(false)}
        onDownloaded={(path) => {
          setAiChoice('local')
          updateSettings({ aiMode: 'local', localModelReady: true, localModelPath: path })
          setLocalDialogOpen(false)
        }}
        title="Download local AI model"
      />
    </div>
  )
}
