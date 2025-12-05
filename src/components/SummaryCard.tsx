import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

type Props = {
  title: string
  value: string
  helper?: string
  accent?: 'teal' | 'cyan' | 'emerald'
  icon?: ReactNode
  footer?: ReactNode
}

const accentMap: Record<NonNullable<Props['accent']>, string> = {
  teal: 'from-teal-400/80 via-cyan-300/70 to-emerald-400/80',
  cyan: 'from-cyan-400/80 via-teal-300/70 to-sky-400/80',
  emerald: 'from-emerald-400/80 via-teal-300/70 to-lime-300/80',
}

export const SummaryCard = ({
  title,
  value,
  helper,
  icon,
  footer,
  accent = 'teal',
}: Props) => (
  <motion.div
    whileHover={{ y: -2 }}
    className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl"
  >
    <div
      className={`pointer-events-none absolute inset-0 opacity-70 blur-3xl ${`bg-gradient-to-br ${accentMap[accent]}`}`}
    />
    <div className="relative flex items-start justify-between gap-3">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-300">
          {title}
        </p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {helper && <p className="text-sm text-slate-300">{helper}</p>}
      </div>
      {icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
          {icon}
        </div>
      )}
    </div>
    {footer && <div className="relative mt-4 text-sm text-slate-200">{footer}</div>}
  </motion.div>
)
