# UI Development

This frontend uses **Vue 3 + Vite**, **Tailwind CSS 4**, and **daisyUI 5**. Tailwind is compiled through the official `@tailwindcss/vite` plugin, so there is no PostCSS config to maintain.

## Local setup

```bash
cd ui
npm install
```

## Run the dev server

```bash
npm run dev
```

> The dev server binds to `127.0.0.1`. If you need to expose another port for Playwright, run `npm run dev -- --host 127.0.0.1 --port 4173` and point `PLAYWRIGHT_BASE_URL` to that URL before running the tests.

## Build for production

```bash
npm run build
```

## Tests

- `npm run test:e2e` – Playwright suite (requires the dev server and `PLAYWRIGHT_BASE_URL`).
- `npm run test` – component/unit tests via Vitest.
