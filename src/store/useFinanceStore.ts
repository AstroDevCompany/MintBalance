import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { AppSettings, Subscription, Transaction } from '../types'

type FinanceState = {
  transactions: Transaction[]
  subscriptions: Subscription[]
  settings: AppSettings
}

type FinanceActions = {
  addTransaction: (input: Omit<Transaction, 'id'>) => void
  removeTransaction: (id: string) => void
  addSubscription: (input: Omit<Subscription, 'id'>) => void
  toggleSubscription: (id: string) => void
  removeSubscription: (id: string) => void
  updateSettings: (settings: Partial<AppSettings>) => void
  clearAll: () => void
  replaceAll: (data: Partial<FinanceState>) => void
}

const defaultSettings: AppSettings = {
  currency: 'USD',
  geminiApiKey: '',
  firstName: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const defaultState: FinanceState = {
  transactions: [],
  subscriptions: [],
  settings: defaultSettings,
}

const createId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const useFinanceStore = create<FinanceState & FinanceActions>()(
  persist(
    (set) => ({
      ...defaultState,
      addTransaction: (input) =>
        set((state) => ({
          transactions: [
            {
              ...input,
              id: createId(),
              createdAt: input.createdAt ?? new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            ...state.transactions,
          ],
        })),
      removeTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),
      addSubscription: (input) =>
        set((state) => ({
          subscriptions: [
            {
              ...input,
              id: createId(),
              createdAt: input.createdAt ?? new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            ...state.subscriptions,
          ],
        })),
      toggleSubscription: (id) =>
        set((state) => ({
          subscriptions: state.subscriptions.map((sub) =>
            sub.id === id
              ? { ...sub, active: !sub.active, updatedAt: new Date().toISOString() }
              : sub,
          ),
        })),
      removeSubscription: (id) =>
        set((state) => ({
          subscriptions: state.subscriptions.filter((s) => s.id !== id),
        })),
      updateSettings: (settings) =>
        set((state) => ({
          settings: { ...state.settings, ...settings, updatedAt: new Date().toISOString() },
        })),
      clearAll: () => {
        set(() => ({
          transactions: [],
          subscriptions: [],
          settings: { ...defaultSettings },
        }))
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('mintbalance-store')
        }
      },
      replaceAll: (data) =>
        set((state) => ({
          transactions: data.transactions ?? state.transactions,
          subscriptions: data.subscriptions ?? state.subscriptions,
          settings: data.settings ?? state.settings,
        })),
    }),
    {
      name: 'mintbalance-store',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        transactions: state.transactions,
        subscriptions: state.subscriptions,
        settings: state.settings,
      }),
    },
  ),
)
