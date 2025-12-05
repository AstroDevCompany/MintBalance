import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type SyncStatus = 'idle' | 'syncing' | 'error' | 'success'

type AuthState = {
  token: string
  userId: string
  username: string
  lastSync: string | null
  status: SyncStatus
  error: string | null
}

type AuthActions = {
  setAuth: (payload: { token: string; userId: string; username: string }) => void
  clearAuth: () => void
  setSyncStatus: (status: SyncStatus) => void
  setLastSync: (iso: string | null) => void
  setError: (message: string | null) => void
}

const initialState: AuthState = {
  token: '',
  userId: '',
  username: '',
  lastSync: null,
  status: 'idle',
  error: null,
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      ...initialState,
      setAuth: ({ token, userId, username }) =>
        set(() => ({
          token,
          userId,
          username,
          error: null,
        })),
      clearAuth: () =>
        set(() => ({
          ...initialState,
        })),
      setSyncStatus: (status) => set(() => ({ status })),
      setLastSync: (iso) => set(() => ({ lastSync: iso })),
      setError: (message) => set(() => ({ error: message })),
    }),
    {
      name: 'mintbalance-auth',
      partialize: (state) => ({
        token: state.token,
        userId: state.userId,
        username: state.username,
        lastSync: state.lastSync,
      }),
    },
  ),
)
