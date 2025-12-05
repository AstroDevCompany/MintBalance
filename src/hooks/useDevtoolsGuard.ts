import { useEffect } from 'react'
import { appWindow } from '@tauri-apps/api/window'

const interceptKeys = (e: KeyboardEvent) => {
  const key = e.key?.toLowerCase()
  const combo =
    (e.ctrlKey || e.metaKey) && e.shiftKey && (key === 'i' || key === 'c' || key === 'j')
  if (combo || key === 'f12') {
    e.preventDefault()
    e.stopPropagation()
  }
}

export const useDevtoolsGuard = () => {
  useEffect(() => {
    const closeDevtools = () => {
      // Close devtools if available (runtime-provided API)
      // @ts-expect-error - not in type definitions for current Tauri version
      appWindow.closeDevtools?.().catch?.(() => {})
    }
    const preventContext = (e: Event) => {
      e.preventDefault()
    }

    window.addEventListener('contextmenu', preventContext)
    window.addEventListener('keydown', interceptKeys, true)
    window.addEventListener('focus', closeDevtools)
    closeDevtools()

    return () => {
      window.removeEventListener('contextmenu', preventContext)
      window.removeEventListener('keydown', interceptKeys, true)
      window.removeEventListener('focus', closeDevtools)
    }
  }, [])
}
