import { exists, createDir, writeBinaryFile, removeFile } from '@tauri-apps/api/fs'
import { join, appConfigDir } from '@tauri-apps/api/path'
import { invoke } from '@tauri-apps/api/tauri'
import { ResponseType, fetch } from '@tauri-apps/api/http'

const MODEL_FILENAME = 'MintAI.gguf'
const MODEL_DOWNLOAD_URL =
  'https://huggingface.co/bartowski/WizardLM-2-7B-abliterated-GGUF/resolve/main/WizardLM-2-7B-abliterated-Q4_K_M.gguf?download=true'
const MODEL_SIZE_BYTES = 4_370_000_000 // ~4.37 GB

const isTauri = () => {
  if (typeof window === 'undefined') return false
  const w = window as any
  return Boolean(w.__TAURI_IPC__ || w.__TAURI_INTERNALS__ || w.__TAURI__)
}

export const getModelDir = async () => {
  try {
    const base = await appConfigDir()
    return join(base, 'models')
  } catch {
    return join('models')
  }
}

export const getModelPath = async () => {
  try {
    const dir = await getModelDir()
    return join(dir, MODEL_FILENAME)
  } catch {
    return MODEL_FILENAME
  }
}

export const getModelPathLabel = async () => {
  try {
    return await getModelPath()
  } catch {
    return `App config dir/models/${MODEL_FILENAME}`
  }
}

export const modelExists = async () => {
  const native = await getNativeModelStatus()
  if (native) return native.exists
  try {
    const path = await getModelPath()
    return await exists(path)
  } catch {
    return false
  }
}

export const getModelStatus = async () => {
  const native = await getNativeModelStatus()
  if (native) return native

  const path = await getModelPath()
  let existsOnDisk = false
  try {
    existsOnDisk = await exists(path)
  } catch {
    existsOnDisk = false
  }
  return { path, exists: existsOnDisk }
}

export const ensureModelDir = async () => {
  if (!isTauri()) return
  const dir = await getModelDir()
  try {
    await createDir(dir, { recursive: true })
  } catch {
    // ignore if already exists
  }
}

export const downloadModel = async (
  onProgress?: (loaded: number, total?: number) => void,
) => {
  if (!isTauri()) {
    throw new Error('Local model downloads are only available in the desktop app.')
  }
  await ensureModelDir()
  const dest = await getModelPath()

  const res = await fetch(
    MODEL_DOWNLOAD_URL,
    {
      method: 'GET',
      responseType: ResponseType.Binary,
      onProgress: (p: { loaded: number; total?: number }) => {
        if (onProgress) onProgress(p.loaded, p.total)
      },
    } as any,
  )

  const data = res.data
  let bytes: Uint8Array
  if (data instanceof ArrayBuffer) {
    bytes = new Uint8Array(data)
  } else if (Array.isArray(data)) {
    bytes = new Uint8Array(data)
  } else {
    bytes = new Uint8Array()
  }

  await writeBinaryFile({ path: dest, contents: bytes })
  return dest
}

export const invokeLocalLlm = async (prompt: string, modelPath?: string) => {
  if (!isTauri()) {
    throw new Error('Local AI is only available in the desktop app.')
  }
  return invoke<string>('llm_generate', { prompt, modelPath })
}

export const removeModel = async () => {
  const { path, exists } = await getModelStatus()
  if (!exists) return
  try {
    await removeFile(path)
  } catch {
    // ignore removal errors
  }
}

type NativeModelStatus = { path: string; exists: boolean }

const getNativeModelStatus = async (): Promise<NativeModelStatus | null> => {
  if (!isTauri()) return null
  try {
    const res = await invoke<NativeModelStatus>('model_status')
    return res
  } catch {
    return null
  }
}

export const getModelSizeLabel = () => '≈4.37 GB'
export const getModelDownloadUrl = () => MODEL_DOWNLOAD_URL
export const getModelFilename = () => MODEL_FILENAME
export const getModelSizeBytes = () => MODEL_SIZE_BYTES
export const isTauriEnv = isTauri
