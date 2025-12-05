# MintBalance (Tauri + React + TypeScript)

MintBalance is a minimal, animation-rich desktop cockpit for tracking income, expenses, and subscriptions with persistent local storage. The UI is built with React, TailwindCSS, Framer Motion, and Recharts, and packaged with Tauri (Rust).

## Features
- Add and review incomes/expenses with category and notes
- Subscription tracker with renewal reminders and monthly burn calculator
- MintAI (Gemini) powered expense predictions (optional API key in Settings)
- Dashboard with cashflow and category charts plus toggleable views
- Persistent local storage for all data and settings
- First-launch name prompt and one-click data wipe in Settings
- Update checker: compares current version to a remote text file and surfaces a download CTA on launch and in Settings
- Account login/signup with cloud sync against auth.mintflow.dev (push/pull ledger + settings)

## Commands
- `npm install` - install JS dependencies
- `npm run dev` - Vite dev server (web preview)
- `npm run tauri:dev` - run the desktop app
- `npm run build` - build the web assets
- `npm run tauri:build` - production desktop build
- `npm run lint` - lint the codebase

## Tauri configuration
- Window size: 1080x720, min 600x400
- Bundle publisher: MintFlow Technologies
- Product name/version: MintBalance 1.0.0

## Notes
- Data is persisted via a small Zustand store keyed under `mintbalance-store`.
- Colors lean on blacks, teals, cyans, and aqua gradients with Manrope typography.
- All destructive actions are gated by an explicit confirmation in Settings.

## Contributing
See `CONTRIBUTING.md` for setup, scripts, and PR guidelines.
