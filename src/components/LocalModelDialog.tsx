import { AnimatePresence, motion } from 'framer-motion'
import { Download, Info, Check, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  downloadModel,
  getModelFilename,
  getModelPathLabel,
  getModelSizeBytes,
  getModelSizeLabel,
} from '../lib/localModel'

type Props = {
  open: boolean
  onClose: () => void
  onDownloaded?: (path: string) => void
  title?: string
}

const formatProgress = (loaded: number, total?: number) => {
  if (!total || total === 0) return '...'
  const pct = Math.min(100, Math.round((loaded / total) * 100))
  return `${pct}%`
}

const formatBytes = (bytes: number) => {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`
  return `${bytes} B`
}

export const LocalModelDialog = ({ open, onClose, onDownloaded, title }: Props) => {
  const [status, setStatus] = useState<'idle' | 'downloading' | 'done'>('idle')
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState<string>('0%')
  const [error, setError] = useState<string | null>(null)
  const [resolvedPath, setResolvedPath] = useState<string>('')

  useEffect(() => {
    if (open) {
      getModelPathLabel().then(setResolvedPath).catch(() => setResolvedPath(''))
      setStatus('idle')
      setError(null)
      setProgress(0)
      setProgressLabel('0%')
    }
  }, [open])

  const handleDownload = async () => {
    setStatus('downloading')
    setError(null)
    try {
      const path = await downloadModel((loaded, total) => {
        setProgress(total ? loaded / total : 0)
        setProgressLabel(formatProgress(loaded, total ?? getModelSizeBytes()))
      })
      setStatus('done')
      setProgress(1)
      setProgressLabel('100%')
      if (onDownloaded) onDownloaded(path)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not download the local AI model.'
      setError(message)
      setStatus('idle')
      setProgress(0)
      setProgressLabel('0%')
    }
  }

  const modelName = getModelFilename()
  const modelSize = getModelSizeLabel()

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
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
                <p className="text-xs uppercase tracking-[0.3em] text-teal-300">
                  Local AI
                </p>
                <h2 className="text-2xl font-bold text-white">
                  {title ?? 'Download local model'}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10"
                aria-label="Close local model dialog"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mt-3 text-sm text-slate-200">
              WizardLM 2 (Q4_K_L) will run locally for offline MintAI. The file will be saved as{' '}
              <span className="font-semibold text-white">{modelName}</span>. Download size{' '}
              <span className="font-semibold text-white">{modelSize}</span>. You can also place
              your own copy manually.
            </p>

            <div className="mt-4 space-y-2 rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-slate-200">
              <div className="flex items-center gap-2">
                <Info size={16} className="text-cyan-200" />
                <p className="text-xs text-slate-300">
                  Path: <span className="font-mono text-white">{resolvedPath || '...'}</span>
                </p>
              </div>
              <p className="text-xs text-slate-400">
                Model file name: <span className="font-semibold text-white">{modelName}</span>
              </p>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="h-2 flex-1 rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 transition-all"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
              <span className="w-12 text-right text-xs text-slate-300">{progressLabel}</span>
            </div>
            <p className="text-xs text-slate-400">
              Estimated size: {modelSize} ({formatBytes(getModelSizeBytes())})
            </p>

            {error && <p className="mt-2 text-sm text-rose-200">{error}</p>}
            {status === 'done' && (
              <p className="mt-2 flex items-center gap-2 text-sm text-emerald-200">
                <Check size={16} /> Model ready. You can switch to local AI.
              </p>
            )}

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleDownload}
                disabled={status === 'downloading'}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow-glow transition hover:brightness-105 disabled:opacity-60"
              >
                {status === 'downloading' ? (
                  <>
                    <Download size={16} className="animate-pulse" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Download local AI
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
