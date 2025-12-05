import { useState } from 'react'
import { motion } from 'framer-motion'
import { LogIn, LogOut, RefreshCw, UploadCloud, UserPlus } from 'lucide-react'
import { login, pullData, pushData, signup } from '../lib/api'
import { useAuthStore } from '../store/useAuthStore'
import { useFinanceStore } from '../store/useFinanceStore'

const nowIso = () => new Date().toISOString()

export const AuthPanel = () => {
  const { token, username, lastSync, status, error, setAuth, clearAuth, setSyncStatus, setLastSync, setError } =
    useAuthStore()
  const replaceAll = useFinanceStore((s) => s.replaceAll)
  const financeState = useFinanceStore((s) => s)
  const [form, setForm] = useState({ username: '', password: '', mode: 'login' as 'login' | 'signup' })

  const handleAuth = async (mode: 'login' | 'signup') => {
    setError(null)
    if (!form.username.trim() || !form.password) {
      setError('Username and password are required.')
      return
    }
    try {
      const action = mode === 'login' ? login : signup
      const res = await action(form.username.trim(), form.password)
      setAuth({ token: res.token, userId: res.userId, username: res.username })
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
            ? err
            : 'Authentication failed.'
      setError(message)
    }
  }

  const handleSync = async () => {
    if (!token) return
    setSyncStatus('syncing')
    setError(null)
    try {
      await pushData(token, {
        transactions: financeState.transactions.map((t) => ({
          ...t,
          updatedAt: t.updatedAt ?? nowIso(),
          createdAt: t.createdAt ?? nowIso(),
        })),
        subscriptions: financeState.subscriptions.map((s) => ({
          ...s,
          updatedAt: s.updatedAt ?? nowIso(),
          createdAt: s.createdAt ?? nowIso(),
        })),
        settings: financeState.settings
          ? { ...financeState.settings, updatedAt: financeState.settings.updatedAt ?? nowIso() }
          : null,
      })
      const pulled = await pullData(token, lastSync ?? undefined)
      replaceAll({
        transactions: pulled.transactions ?? [],
        subscriptions: pulled.subscriptions ?? [],
        settings: pulled.settings ?? financeState.settings,
      })
      const syncTime = new Date().toISOString()
      setLastSync(syncTime)
      setSyncStatus('success')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed.'
      setError(message)
      setSyncStatus('error')
    }
  }

  const handleLogout = () => {
    clearAuth()
    setError(null)
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-teal-300">Account</p>
          <p className="text-lg font-semibold text-white">Cloud sync</p>
        </div>
        {token ? <LogOut className="text-emerald-200" size={18} /> : <LogIn className="text-emerald-200" size={18} />}
      </div>

      {!token ? (
        <div className="space-y-2">
          <label className="text-sm text-slate-200">
            Username
            <input
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-teal-300 focus:bg-white/10"
              placeholder="your-name"
            />
          </label>
          <label className="text-sm text-slate-200">
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-teal-300 focus:bg-white/10"
              placeholder="•••••••"
            />
          </label>
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAuth('login')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow-glow transition hover:brightness-105"
            >
              <LogIn size={16} />
              Log in
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAuth('signup')}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
            >
              <UserPlus size={16} />
              Sign up
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
            Signed in as <span className="font-semibold text-white">{username}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleSync}
              disabled={status === 'syncing'}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow-glow transition hover:brightness-105 disabled:opacity-60"
            >
              <UploadCloud size={16} />
              {status === 'syncing' ? 'Syncing...' : 'Sync now'}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
            >
              <LogOut size={16} />
              Log out
            </motion.button>
            <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200">
              <RefreshCw size={14} className={status === 'syncing' ? 'animate-spin' : ''} />
              {lastSync ? `Last sync ${new Date(lastSync).toLocaleString()}` : 'Never synced'}
            </div>
          </div>
          {status === 'error' && error && (
            <p className="text-sm text-rose-200">Sync error: {error}</p>
          )}
        </div>
      )}
      {error && !token && <p className="text-sm text-rose-200">{error}</p>}
    </div>
  )
}
