import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import { FirstLaunchDialog } from './components/FirstLaunchDialog'
import { Navigation } from './components/Navigation'
import { UpdateDialog } from './components/UpdateDialog'
import { useDevtoolsGuard } from './hooks/useDevtoolsGuard'
import { useUpdateCheck } from './hooks/useUpdateCheck'
import { Dashboard } from './pages/Dashboard'
import { SpendingInsights } from './pages/SpendingInsights'
import { Settings } from './pages/Settings'
import { Subscriptions } from './pages/Subscriptions'
import { Transactions } from './pages/Transactions'
import type { PageKey } from './pages/types'
import { useFinanceStore } from './store/useFinanceStore'
import { fetchMintAiKey } from './lib/mintai'
import { validateStoredLicense } from './lib/premium'

const pageLookup: Record<PageKey, JSX.Element> = {
  dashboard: <Dashboard />,
  transactions: <Transactions />,
  subscriptions: <Subscriptions />,
  insights: <SpendingInsights />,
  settings: <Settings />,
}

const App = () => {
  const [page, setPage] = useState<PageKey>('dashboard')
  const settings = useFinanceStore((s) => s.settings)
  const updateSettings = useFinanceStore((s) => s.updateSettings)
  const year = new Date().getFullYear()
  const version = import.meta.env.VITE_APP_VERSION ?? '1.0.0'
  const [dismissedUpdate, setDismissedUpdate] = useState(false)
  const { available, latestVersion } = useUpdateCheck(version)
  const showUpdateDialog = available && !dismissedUpdate
  useDevtoolsGuard()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!settings.premiumToken) {
        updateSettings({
          premiumEnabled: false,
          premiumLastChecked: new Date().toISOString(),
          premiumError: 'Premium is not unlocked.',
        })
        return
      }
      const valid = await validateStoredLicense(settings.premiumToken)
      if (cancelled) return
      updateSettings({
        premiumEnabled: valid,
        premiumLastChecked: new Date().toISOString(),
        premiumError: valid ? null : 'Premium validation failed.',
      })
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.premiumToken])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!settings.premiumEnabled) {
        updateSettings({
          mintAiReady: false,
          mintAiError: 'MintAI requires Premium.',
          mintAiLastLoaded: new Date().toISOString(),
        })
        return
      }
      try {
        await fetchMintAiKey()
        if (cancelled) return
        updateSettings({
          mintAiReady: true,
          mintAiLastLoaded: new Date().toISOString(),
          mintAiError: null,
        })
      } catch (err) {
        if (cancelled) return
        const message =
          err instanceof Error ? err.message : 'MintAI key could not be loaded.'
        updateSettings({
          mintAiReady: false,
          mintAiLastLoaded: new Date().toISOString(),
          mintAiError: message,
        })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [settings.premiumEnabled, updateSettings])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(45,212,191,0.08),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.08),transparent_25%)]" />
      <div className="relative mx-auto max-w-7xl px-4 py-6 space-y-6">
        <Navigation active={page} onChange={setPage} />
        {pageLookup[page]}
        <footer className="pt-4 text-center text-xs text-slate-400">
          © {year} MintFlow Technologies — MintBalance {version}
        </footer>
      </div>
      <FirstLaunchDialog />
      <UpdateDialog
        openDialog={showUpdateDialog}
        currentVersion={version}
        latestVersion={latestVersion}
        onClose={() => setDismissedUpdate(true)}
      />
    </div>
  )
}

export default App
