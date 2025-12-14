export type TransactionKind = 'income' | 'expense'

export interface Transaction {
  id: string
  type: TransactionKind
  category: string
  source: string
  amount: number
  date: string
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export type SubscriptionFrequency = 'weekly' | 'monthly' | 'quarterly' | 'annual'

export interface Subscription {
  id: string
  name: string
  amount: number
  frequency: SubscriptionFrequency
  nextPayment: string
  category: string
  notes?: string
  active: boolean
  createdAt?: string
  updatedAt?: string
}

export interface AppSettings {
  currency: string
  firstName: string
  mintAiReady?: boolean
  mintAiLastLoaded?: string
  mintAiError?: string | null
  premiumEnabled?: boolean
  premiumToken?: string | null
  premiumLastChecked?: string
  premiumError?: string | null
  createdAt?: string
  updatedAt?: string
}
