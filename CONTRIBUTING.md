# Contributing to MintBalance

Thanks for helping improve MintBalance! This guide keeps contributions consistent and smooth.

## Environment
- Node.js 18+ and npm
- Rust toolchain (for Tauri)
- pnpm/yarn are fine, but npm scripts are canonical

## Setup
1) Install deps: `npm install`
2) Run the app (web preview): `npm run dev`
3) Run the desktop app: `npm run tauri:dev`

## Scripts
- `npm run lint` — lint TypeScript/React
- `npm run build` — type-check + production build
- `npm run tauri:build` — production desktop bundle

## Code style
- Keep components small and reusable; favor composition over large files.
- Tailwind for styling; keep gradients/colors consistent with the existing palette.
- Use TypeScript strictly; avoid `any`.
- Add concise comments only where logic is non-obvious.
- Persist data via the existing Zustand stores; do not introduce ad-hoc storage.

## Testing and checks
- Run `npm run lint` before opening a PR.
- Run `npm run build` to ensure type safety and production readiness.
- For platform-specific changes, run `npm run tauri:dev` to verify desktop behavior.

## Pull requests
- Keep PRs focused and well-scoped.
- Describe the change, rationale, and testing performed.
- Note any UI impacts (screenshots encouraged).
- Avoid unrelated formatting or refactors in feature/bugfix PRs.

## Security and data
- Do not log sensitive data.
- Respect local-only storage; avoid adding remote calls without clear justification.

## Updating dependencies
- Prefer minimal bumps; test both `npm run lint` and `npm run build`.
- For Rust deps, run `cargo check --manifest-path src-tauri/Cargo.toml` after changes.
