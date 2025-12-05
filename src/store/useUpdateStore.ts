import { create } from 'zustand'

type UpdateState = {
  latestVersion: string | null
  available: boolean
  checking: boolean
  checked: boolean
  error: string | null
  startCheck: () => void
  finishCheck: (latestVersion: string, available: boolean) => void
  failCheck: (message: string) => void
}

export const useUpdateStore = create<UpdateState>((set) => ({
  latestVersion: null,
  available: false,
  checking: false,
  checked: false,
  error: null,
  startCheck: () =>
    set(() => ({
      checking: true,
      error: null,
    })),
  finishCheck: (latestVersion, available) =>
    set(() => ({
      latestVersion,
      available,
      checking: false,
      checked: true,
      error: null,
    })),
  failCheck: (message) =>
    set(() => ({
      checking: false,
      checked: true,
      available: false,
      error: message,
    })),
}))
