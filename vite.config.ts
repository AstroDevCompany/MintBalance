import fs from 'node:fs'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const tauriConf = JSON.parse(fs.readFileSync('./src-tauri/tauri.conf.json', 'utf8'))
const appVersion = tauriConf?.package?.version ?? '1.0.0'

// Vite config tailored for Tauri desktop builds
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: process.env.TAURI_PLATFORM === 'windows' ? 'chrome105' : 'safari14',
    minify: process.env.TAURI_DEBUG ? false : ('esbuild' as const),
    sourcemap: !!process.env.TAURI_DEBUG,
  },
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
  },
})
