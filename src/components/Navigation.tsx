import { motion } from 'framer-motion'
import { LayoutDashboard, Repeat, Settings, Sparkles, Wallet } from 'lucide-react'
import type { JSX } from 'react'
import type { PageKey } from '../pages/types'

const tabs: { id: PageKey; label: string; icon: JSX.Element }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'transactions', label: 'Transactions', icon: <Wallet size={18} /> },
  { id: 'subscriptions', label: 'Subscriptions', icon: <Repeat size={18} /> },
  { id: 'insights', label: 'Insights', icon: <Sparkles size={18} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
]

type Props = {
  active: PageKey
  onChange: (page: PageKey) => void
}

export const Navigation = ({ active, onChange }: Props) => (
  <nav className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/5 px-3 py-3 backdrop-blur-lg border border-white/10">
    <div className="flex items-center gap-2 text-sm text-slate-200">
      <img
        src="/mintbalance-logo.png"
        alt="MintBalance logo"
        className="h-10 w-10 rounded-xl bg-white/5 object-cover shadow-glow"
      />
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">MintBalance</p>
        <p className="text-sm font-semibold text-white">Finance cockpit</p>
      </div>
    </div>
    <div className="flex flex-1 flex-wrap justify-end gap-2">
      {tabs.map((tab) => {
        const isActive = tab.id === active
        return (
          <motion.button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
              isActive
                ? 'text-slate-900'
                : 'text-slate-200 hover:text-white hover:bg-white/10'
            }`}
            whileTap={{ scale: 0.98 }}
          >
            {isActive && (
              <motion.span
                layoutId="nav-pill"
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-teal-300 via-cyan-300 to-emerald-300"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
              />
            )}
            <span className="relative z-10">{tab.icon}</span>
            <span className="relative z-10">{tab.label}</span>
          </motion.button>
        )
      })}
    </div>
  </nav>
)
