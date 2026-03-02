# Sahayog AI Frontend

Next.js frontend for Sahayog AI cooperative society platform.

## Setup

1. Install:
   ```bash
   npm install
   ```

2. Create `.env.local` (optional):
   ```
   NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
   ```

## Run

```bash
# Development
npm run dev

# Production
npm run build && npm start
```

App: `http://localhost:3000`

## Structure

- `/admin` — superadmin: tenants, rules, billing
- `/dashboard` — society staff: members, loans, accounts, accounting
- `/member-portal` — member login
- `/portal` — member self-service: account, loans, pay
