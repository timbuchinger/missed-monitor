# missed-monitor API

Minimal NestJS API for missed-monitor with a single health endpoint.

Quick start

1. Copy the example environment file and adjust values if needed (the defaults
   match the credentials used by `docker-compose` in the repo root):

```bash
cd api
cp .env.example .env
```

2. From `api/` install dependencies:

```bash
cd api
npm install
```

3. Run in development mode:

```bash
npm run start:dev
```

4. Build and run production:

```bash
npm run build
npm start
```

Health endpoint

- `GET /ready` — returns boolean `true` when the app is up.
