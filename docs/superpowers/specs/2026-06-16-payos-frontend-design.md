# Design: Sync the reactjs-ecommerce-app frontend with PayOS

**Date:** 2026-06-16
**Status:** Design approved (sections 1–5), pending implementation

## Goal

The go-ecommerce-app backend has replaced Stripe with PayOS. The frontend still calls the old
flow (`POST /orders/payment/intent` → `{id, client_secret}`) and shows a "Stripe payment intent"
stub. Update the frontend to match: call `POST /orders/payment/link`, show an **inline VietQR QR
code** plus a button that opens the **PayOS checkout page** (`checkout_url`), and auto-poll for the
`paid` status.

## Current context (surveyed)

- Stack: Vite + React 18 + TypeScript + `@tanstack/react-query` + axios + react-router-dom.
- Stripe.js is **not** embedded — the app only calls the backend API.
- `src/lib/api.ts`: `OrderAPI.paymentIntent(order_id)` → POST `/orders/payment/intent` → `{id, client_secret}`.
- `src/pages/OrderDetail.tsx`: the "Pay by card" button calls `paymentIntent`, stores `intentInfo`
  state, and shows the intent id + Stripe text. Already uses `useQueryClient` +
  `invalidateQueries({queryKey:["orders", id]})`.
- `src/lib/types.ts`: `Order.payment_intent_id?`, `PaymentStatus`.
- `src/pages/Checkout.tsx`, `src/pages/Orders.tsx`: contain "Stripe" text.
- Router (`src/App.tsx`): `<Routes>` with `<Route path=...>`; order detail at `/orders/:id`.

## Decisions

- **Payment UX:** show **both** the inline QR **and** a button that opens `checkout_url` (fallback).
- **QR rendering:** add the `qrcode.react` dependency (renders the VietQR string, no network call).
- **Paid detection:** auto-poll the order via React Query `refetchInterval` (~4s) while pending.
- `payment_intent_id` keeps its name (the backend still returns this field, now holding the PayOS
  `paymentLinkId`).

## Scope & files

- `src/lib/types.ts` — add the `PaymentLink` type.
- `src/lib/api.ts` — `paymentIntent` → `createPaymentLink` (endpoint + response type).
- `src/pages/OrderDetail.tsx` — replace the payment UI: QR + PayOS button + auto-poll.
- `src/App.tsx` — add the `/payment/success` + `/payment/cancel` routes.
- `src/pages/PaymentResult.tsx` (new) — shared success/cancel page.
- `src/pages/Checkout.tsx`, `src/pages/Orders.tsx` — change Stripe text → PayOS.
- `package.json` — add `qrcode.react`.

## Detailed design

### API + types layer

```ts
// src/lib/types.ts
export type PaymentLink = {
  checkout_url: string;
  qr_code: string;        // VietQR string (EMVCo payload)
  payment_link_id: string;
  order_code: number;
  amount: number;         // VND
};
```

```ts
// src/lib/api.ts — replace paymentIntent
createPaymentLink: (order_id: number) =>
  api
    .post<APIResponse<PaymentLink>>("/orders/payment/link", { order_id })
    .then((r) => r.data.data),
```
Remove the `paymentIntent` function and the `{id, client_secret}` type.

### OrderDetail — payment UI

When `order.payment_status === "pending"` and the order is not cancelled:
- A **"Thanh toán qua PayOS"** ("Pay via PayOS") button → `createPaymentLink(order.id)` → store the
  `PaymentLink` in the `link` state.
- When `link` is set, render:
  - `<QRCodeSVG value={link.qr_code} size={200} />` (from `qrcode.react`),
  - a line with the amount `link.amount` formatted as VND,
  - a button/anchor **"Mở trang thanh toán PayOS"** ("Open the PayOS payment page") →
    `link.checkout_url` (new tab, `rel="noopener"`).
- **Auto-poll:** the order is fetched via `useQuery({ queryKey:["orders", id], ... })`. Add
  `refetchInterval: (q) => q.state.data?.payment_status === "pending" ? 4000 : false` so that when
  the webhook flips the status to `paid`, the UI updates itself and stops polling.
- When `payment_status === "paid"`: show "✓ Đã thanh toán" ("✓ Paid") and hide the button.
- Remove the `intentInfo` state, the "Contacting Stripe" `paying` text, and all Stripe text.

### Success/cancel routes

- `src/pages/PaymentResult.tsx`: takes a `status: "success" | "cancel"` prop/variable; shows the
  matching message + a "Về đơn hàng" ("Back to orders") button (`/orders`). On success, call
  `invalidateQueries({queryKey:["orders"]})` so the list/order refreshes.
- `src/App.tsx`: add
  - `<Route path="/payment/success" element={<PaymentResult status="success" />} />`
  - `<Route path="/payment/cancel" element={<PaymentResult status="cancel" />} />`

### Text cleanup

- `Checkout.tsx`: "Orders are placed first, then settled by card via Stripe from the order page."
  → "Đơn được tạo trước, rồi thanh toán qua PayOS (VietQR) từ trang đơn hàng." ("Orders are created
  first, then paid via PayOS (VietQR) from the order page.")
- `Orders.tsx`: remove the Stripe wording if present (the PaymentBadge logic is unchanged).

## Configuration note (outside the frontend, required to run for real)

⚠️ Backend `.env`: `PAYOS_RETURN_URL` / `PAYOS_CANCEL_URL` must point to the **frontend origin**
(e.g. `http://localhost:5173/payment/success` and `/payment/cancel`), NOT the backend `:9000`.
This is where PayOS redirects the customer back after paying via `checkout_url`.

## Out of scope (YAGNI)

- No refund/cancel-payment handling in the frontend (beyond the display route).
- No webhook verification in the frontend (that is the backend's job).
- No new state management — use the existing React Query.

## Success criteria

- `npm run build` (tsc + vite) is clean.
- Order page: the PayOS button → shows the QR + a button to open the PayOS page; after payment, the
  status switches to "✓ Đã thanh toán" ("✓ Paid") automatically via auto-poll.
- No more "Stripe" / `client_secret` / `/orders/payment/intent` anywhere in `src/`.
- The `/payment/success` + `/payment/cancel` routes work.
