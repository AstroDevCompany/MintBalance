# MintBalance (Tauri + React + TypeScript)

MintBalance is a minimal, animation-rich desktop cockpit for tracking income, expenses, and subscriptions with persistent local storage. The UI is built with React, TailwindCSS, Framer Motion, and Recharts, and packaged with Tauri (Rust).

## Features

- Add and review incomes/expenses with category and notes
- Subscription tracker with renewal reminders and monthly burn calculator
- MintAI: cloud (Gemini) and local (WizardLM GGUF) powered insights, predictions, and expense auto-categorization
- Dashboard with cashflow and category charts plus toggleable views
- Spending Insights page with MintAI (Gemini) summaries across categories, merchants, anomalies, and forecasts
- Persistent local storage for all data and settings
- First-launch name prompt and one-click data wipe in Settings
- Update checker: compares current version to a remote text file and surfaces a download CTA on launch and in Settings
- Account login/signup with cloud sync against auth.mintflow.dev (push/pull ledger + settings)

## MintAI setup

1. Go to Settings -> MintAI, choose **Cloud** or **Local**.
   - Cloud: paste your Gemini API key and click **Save API key** to validate it. The status pill will show **Ready** when enabled.
   - Local: download or place `MintAI.gguf` in your app config models folder (e.g., on Windows: `C:\Users\<you>\AppData\Roaming\com.mintflow.mintbalance\models\MintAI.gguf`). When the model is present, the UI shows “Model ready.” You can remove it via **Remove local model**.
2. In the Transactions page, choose **Expense** and pick **Auto (MintAI)** to auto-categorize the expense with the selected AI mode.
3. Open the **Spending Insights** page, choose a lookback window, and click **Generate with MintAI** (uses the selected AI mode) to get high-signal spending insights (categories, merchants, anomalies, forecasts).

## Keyboard & form QoL

- In the Add transaction form, pressing Enter in a field focuses the next field (Source → Category → Amount → Date → Notes). From Notes, Enter triggers Save.
- The Source field auto-focuses on open; expenses default to **Auto (MintAI)** when AI is enabled.
- Delete actions now require confirmation in lists (Transactions, Subscriptions): first click shows confirm (check) and cancel (X); delete icon is red by default.

## Commands

- `npm install` - install JS dependencies
- `npm run dev` - Vite dev server (web preview)
- `npm run tauri:dev` - run the desktop app
- `npm run build` - build the web assets
- `npm run tauri:build` - production desktop build
- `npm run lint` - lint the codebase
- `cargo build --release --features gpu` - build with cuda

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
