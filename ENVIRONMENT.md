# Environment Configuration

This project uses Vite environment files for environment-specific API configuration.

## Files

- `.env.development`
- `.env.production`
- `.env.test`
- `.env.example` (safe template committed to git)

## Variables

- `VITE_API_BASE_URL`
  - Development: usually `/sp` (uses Vite proxy and avoids CORS in local dev)
  - Production/Test: absolute API URL like `https://host/sp`

- `VITE_PROXY_TARGET`
  - Used only in local development (`vite dev`)
  - Not needed in production or test builds

## Commands

- `npm run dev`
- `npm run build:development`
- `npm run build:production`
- `npm run build:test`

## Git Safety

Real `.env` files are ignored by git.
Only `.env.example` is committed.
