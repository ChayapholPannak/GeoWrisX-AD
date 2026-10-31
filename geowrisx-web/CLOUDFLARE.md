# Cloudflare Pages deployment

This project is a React (Vite) SPA with Pages Functions under `functions/api/`. Its public API contract stays at `/api/*`.

In Cloudflare Workers & Pages, import `ChayapholPannak/GeoWrisX-AD` and use these settings:

| Setting | Value |
|---|---|
| Production branch | `main` |
| Root directory | `geowrisx-web` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | `22` |

Set these values for both Production and Preview environments:

- Plaintext variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `ALLOWED_ORIGIN`.
- Encrypted secrets: `SUPABASE_SERVICE_ROLE_KEY`, `DEVICE_INGEST_SECRET`.

`ALLOWED_ORIGIN` must be the exact deployed Pages origin, for example `https://YOUR-SITE.pages.dev`. Never use `*` and never prefix the two server-only secrets with `VITE_`.

For local full-stack testing, copy `.env.example` to `.env`, run `npm run build`, then run `npm run cloudflare:dev`. Pages Functions and the static site are served together at `http://localhost:8788`.

Before switching DNS or disabling Netlify, add the Cloudflare Pages URL to Supabase Authentication's Site URL and Redirect URLs, smoke-test login plus every `/api/*` route, and keep Netlify available for rollback until the production check succeeds.
