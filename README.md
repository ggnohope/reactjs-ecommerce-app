# VERSO — Storefront

A production-style React frontend for the Go e-commerce API
(`/Users/hoalam/Codes/go-ecommerce-app`, served at `http://localhost:9000`).

Editorial/broadsheet aesthetic: Fraunces display serif, Libre Franklin body,
Spline Sans Mono for prices and labels, paper-and-ink palette with a vermillion accent.

## Stack

- Vite + React 18 + TypeScript
- Tailwind CSS v4, Motion (animations)
- TanStack Query (server state), Axios (with automatic refresh-token retry)
- React Router v6

## Run

```sh
npm install
npm run dev        # http://localhost:5173 (API base set in .env → VITE_API_URL)
npm run build      # production build to dist/
```

## Seed demo data

```sh
node scripts/seed.mjs   # registers seller@verso.shop / verso123, 5 categories, 14 products
```

Note: becoming a seller requires a verified account (OTP via AWS SNS), so the
become-seller step only succeeds after verifying through the UI (`/verify`).

## Features

| Area | Details |
|---|---|
| Catalogue | Search, category / price filters, pagination, product detail with image gallery |
| Auth | Register, login, JWT refresh, logout, logout-all-devices, OTP account verification |
| Cart | Drawer with quantity stepper (API increments; minus = remove + re-add), remove |
| Checkout | Address book (CRUD, default selection), order placement from cart |
| Orders | Ledger list, detail with status rail, Stripe payment-intent creation |
| Account | Profile editing, addresses, become-seller upgrade, session management |
| Seller (Atelier) | Product CRUD, status toggle, S3 image upload, category creation, pagination |

Demo account: `seller@verso.shop` / `verso123` (verified, seller).
