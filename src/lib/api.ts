import type { AppSettings, Subscription, Transaction } from '../types'
import { fetch as tauriFetch, ResponseType } from '@tauri-apps/api/http'

const BASE_URL = 'https://auth.mintflow.dev'

type JsonRecord = Record<string, unknown>

const isTauri = () => typeof window !== 'undefined' && '__TAURI_IPC__' in window

const jsonFetch = async <T = JsonRecord>(path: string, options: RequestInit = {}): Promise<T> => {
  const url = `${BASE_URL}${path}`
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  try {
    if (isTauri()) {
      const res = await tauriFetch<T | JsonRecord | string>(url, {
        method: ((options.method as string | undefined) ?? 'GET') as any,
        headers,
        body:
          options.body && typeof options.body === 'string'
            ? { type: 'Text', payload: options.body }
            : undefined,
        responseType: ResponseType.JSON,
      })

      if (res.status && res.status >= 400) {
        const body = (res.data as JsonRecord) ?? {}
        const message = (body?.error as string) || `Request failed (${res.status})`
        throw new Error(message)
      }
      return res.data as T
    }

    const res = await fetch(url, {
      ...options,
      headers,
    })
    const text = await res.text()
    const data = (text ? JSON.parse(text) : {}) as JsonRecord
    if (!res.ok) {
      throw new Error((data?.error as string) || `Request failed (${res.status})`)
    }
    return data as T
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === 'string'
          ? err
          : 'Network request failed.'
    throw new Error(message)
  }
}

export const signup = (username: string, password: string) =>
  jsonFetch<{ token: string; userId: string; username: string }>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })

export const login = (username: string, password: string) =>
  jsonFetch<{ token: string; userId: string; username: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })

export type PullResponse = {
  transactions: Transaction[]
  subscriptions: Subscription[]
  settings: AppSettings | null
}

export const pullData = (token: string, since?: string): Promise<PullResponse> => {
  const url = since ? `/api/sync/pull?since=${encodeURIComponent(since)}` : '/api/sync/pull'
  return jsonFetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  }) as Promise<PullResponse>
}

type PushPayload = {
  transactions?: Transaction[]
  subscriptions?: Subscription[]
  settings?: AppSettings | null
}

export const pushData = (token: string, payload: PushPayload) =>
  jsonFetch('/api/sync/push', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
