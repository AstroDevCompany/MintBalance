import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Sparkles, Trash2 } from 'lucide-react'
import { open } from '@tauri-apps/api/shell'
import { useFinanceStore } from '../store/useFinanceStore'
import { useUpdateCheck } from '../hooks/useUpdateCheck'
import { AuthPanel } from '../components/AuthPanel'
import { fetchMintAiKey } from '../lib/mintai'
import { verifyLicenseKey } from '../lib/premium'

const currencies = ['USD', 'EUR', 'GBP', 'CHF', 'CAD', 'AUD']

export const Settings = () => {
  const { currency, mintAiReady, mintAiLastLoaded, mintAiError, firstName, premiumEnabled } =
    useFinanceStore(
      (s) => s.settings,
    )
  const updateSettings = useFinanceStore((s) => s.updateSettings)
  const clearAll = useFinanceStore((s) => s.clearAll)
  const [keyLoading, setKeyLoading] = useState(false)
  const [keyMessage, setKeyMessage] = useState<string | null>(null)
  const [licenseKey, setLicenseKey] = useState('')
  const [licenseStatus, setLicenseStatus] = useState<'idle' | 'checking' | 'success' | 'error'>(
    premiumEnabled ? 'success' : 'idle',
  )
  const [licenseMessage, setLicenseMessage] = useState<string | null>(null)
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

  const handleRefreshKey = async () => {
    setKeyLoading(true)
    setKeyMessage(null)
    try {
      await fetchMintAiKey(true)
      updateSettings({
        mintAiReady: true,
        mintAiLastLoaded: new Date().toISOString(),
        mintAiError: null,
      })
      setKeyMessage('MintAI is ready for this session.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'MintAI is unavailable right now.'
      updateSettings({
        mintAiReady: false,
        mintAiLastLoaded: new Date().toISOString(),
        mintAiError: message,
      })
      setKeyMessage('MintAI is unavailable right now. Try again soon.')
    } finally {
      setKeyLoading(false)
    }
  }

  const handleValidateLicense = async () => {
    const trimmed = licenseKey.trim()
    if (!trimmed) {
      setLicenseStatus('error')
      setLicenseMessage('Enter a license key to continue.')
      return
    }
    setLicenseStatus('checking')
    setLicenseMessage(null)
    try {
      const { token } = await verifyLicenseKey(trimmed)
      updateSettings({
        premiumEnabled: true,
        premiumToken: token,
        premiumLastChecked: new Date().toISOString(),
        premiumError: null,
      })
      setLicenseStatus('success')
      setLicenseMessage('Premium unlocked on this device.')
      setLicenseKey('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not validate that license.'
      updateSettings({
        premiumEnabled: false,
        premiumToken: null,
        premiumLastChecked: new Date().toISOString(),
        premiumError: message,
      })
      setLicenseStatus('error')
      setLicenseMessage(message)
    }
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
              <Shield size={16} /> Premium
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                premiumEnabled
                  ? 'bg-emerald-400/20 text-emerald-100'
                  : 'bg-amber-400/20 text-amber-100'
              }`}
            >
              {premiumEnabled ? 'Unlocked' : 'Locked'}
            </span>
          </div>
          <p className="text-sm text-slate-200">
            Enter your license key to unlock MintAI and other premium features on this device.
          </p>
          <div className="space-y-2 rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-slate-300">
            <p>
              Status:{' '}
              <span className={licenseStatus === 'error' ? 'text-rose-200' : 'text-emerald-200'}>
                {premiumEnabled
                  ? 'Premium is active on this device.'
                  : licenseStatus === 'checking'
                    ? 'Checking license...'
                    : 'Not unlocked yet.'}
              </span>
            </p>
            <p>
              Last check:{' '}
              <span className="font-semibold text-white">
                {licenseStatus === 'checking'
                  ? 'Validating...'
                  : licenseStatus === 'success'
                    ? 'Just now'
                    : premiumEnabled && licenseStatus === 'idle'
                      ? 'Verified earlier'
                      : 'Not checked yet'}
              </span>
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-200">
              License key
              <input
                value={licenseKey}
                onChange={(e) => {
                  setLicenseKey(e.target.value)
                  setLicenseStatus(premiumEnabled ? 'success' : 'idle')
                  setLicenseMessage(null)
                }}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-teal-300 focus:bg-white/10"
              />
            </label>
            <div className="flex justify-end">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleValidateLicense}
                disabled={licenseStatus === 'checking'}
                className="rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow-glow transition hover:brightness-105 disabled:opacity-60"
              >
                {licenseStatus === 'checking' ? 'Validating...' : 'Unlock Premium'}
              </motion.button>
            </div>
          </div>
          {licenseMessage && (
            <p
              className={`text-sm ${
                licenseStatus === 'error' ? 'text-rose-200' : 'text-emerald-200'
              }`}
            >
              {licenseMessage}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between gap-2 text-sm font-semibold text-white">
            <span className="inline-flex items-center gap-2">
              <Sparkles size={16} /> MintAI
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                mintAiReady
                  ? 'bg-emerald-400/20 text-emerald-100'
                  : 'bg-amber-400/20 text-amber-100'
              }`}
            >
              {mintAiReady ? 'Ready' : 'Not ready'}
            </span>
          </div>

          <p className="text-sm text-slate-200">
            MintAI runs in the cloud. Refresh if you see issues with insights or auto-categorization.
          </p>

          <div className="space-y-2 rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-slate-300">
            <p>
              Last check:{' '}
              <span className="font-semibold text-white">
                {mintAiLastLoaded
                  ? new Date(mintAiLastLoaded).toLocaleString()
                  : 'Not checked yet'}
              </span>
            </p>
            <p className={mintAiError ? 'text-rose-200' : 'text-emerald-200'}>
              Status:{' '}
              {mintAiError
                ? 'MintAI is unavailable right now.'
                : mintAiReady
                  ? 'MintAI is ready for this session.'
                  : 'MintAI is not ready yet.'}
            </p>
          </div>

          <div className="flex justify-end">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleRefreshKey}
              disabled={keyLoading}
              className="rounded-xl bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow-glow transition hover:brightness-105 disabled:opacity-60"
            >
              {keyLoading ? 'Loading...' : 'Refresh MintAI'}
            </motion.button>
          </div>
          {keyMessage && <p className="text-sm text-slate-200">{keyMessage}</p>}
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
    </div>
  )
}
