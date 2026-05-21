# AGENTS.md

## Scope
- React + Vite starter kit template for building DiligenceFabric-powered applications. Uses `@ubti/diligence-fabric-sdk` for API integration.

## Start Here
- Install: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`

## Project Layout
- `src/components/` — reusable UI components
- `src/pages/` — route-level page components
- `src/layout/` — application layout (shell, navigation)
- `src/router/` — React Router configuration
- `src/services/` — API service wrappers
- `src/hooks/` — custom React hooks
- `src/server/` — server-side logic (if applicable)
- `src/config/` — app configuration (SDK settings, env)
- `src/utils/` — utility functions

## Working Rules
- **React 18** with TypeScript 5 and Vite
- **Tailwind CSS** for styling; do not mix with CSS modules or other frameworks
- **MSAL** (`@azure/msal-browser`) handles Azure AD authentication
- **DF SDK** (`@ubti/diligence-fabric-sdk`) is the standard way to call the DiligenceFabric API — do not write raw API calls
- Menu location configurable via `PUBLIC_MENU_LOCATION` env var (`top` or `side`)
- Keep shared DF components in `src/lib/components/` for template upgrade compatibility
- ESLint flat config (`eslint.config.js`) — no `.eslintrc`

## Validation
```bash
npm run lint
npm run build
```

## References
- [README.md](README.md) — setup, upgrade, and deployment guide
