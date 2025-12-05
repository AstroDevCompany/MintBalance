import { motion, AnimatePresence } from 'framer-motion'
import { Download, X } from 'lucide-react'
import { open } from '@tauri-apps/api/shell'

type Props = {
  openDialog: boolean
  currentVersion: string
  latestVersion: string | null
  onClose: () => void
}

const DOWNLOAD_URL = 'https://mintflow.dev/products'

export const UpdateDialog = ({
  openDialog,
  currentVersion,
  latestVersion,
  onClose,
}: Props) => (
  <AnimatePresence>
    {openDialog && (
      <motion.div
        className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-[520px] max-w-[92vw] rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 shadow-2xl"
          initial={{ scale: 0.95, y: 8, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 22 }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-teal-300">Update</p>
              <h2 className="text-2xl font-bold text-white">New version available</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10"
              aria-label="Close update dialog"
            >
              <X size={18} />
            </button>
          </div>
          <p className="mt-3 text-sm text-slate-200">
            You are on <span className="font-semibold text-white">{currentVersion}</span>. Latest:{' '}
            <span className="font-semibold text-white">{latestVersion ?? 'unknown'}</span>. Grab the
            newest build to stay current.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/5"
            >
              Later
            </button>
            <button
              onClick={() => open(DOWNLOAD_URL)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow-glow transition hover:brightness-105"
            >
              <Download size={16} />
              Download now
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
)
