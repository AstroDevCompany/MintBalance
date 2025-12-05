import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useFinanceStore } from '../store/useFinanceStore'

export const FirstLaunchDialog = () => {
  const firstName = useFinanceStore((s) => s.settings.firstName)
  const updateSettings = useFinanceStore((s) => s.updateSettings)
  const [snoozed, setSnoozed] = useState(false)
  const [name, setName] = useState(firstName)
  const open = !firstName && !snoozed

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    updateSettings({ firstName: name.trim() })
    setSnoozed(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-[420px] max-w-[90vw] rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 shadow-2xl"
            initial={{ scale: 0.95, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 10, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          >
            <p className="text-xs uppercase tracking-[0.3em] text-teal-300">
              Welcome
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              Let's personalize MintBalance
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              We'll use your first name in the dashboard and reports. You can
              change it anytime in Settings.
            </p>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <label className="block text-sm text-slate-200">
                First name
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none transition focus:border-teal-300 focus:bg-white/10"
                  placeholder="Alex"
                />
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSnoozed(true)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/5"
                >
                  Later
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow-glow transition hover:brightness-105"
                >
                  Save & continue
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
