# Design: Đồng bộ frontend reactjs-ecommerce-app với PayOS

**Ngày:** 2026-06-16
**Trạng thái:** Đã duyệt thiết kế (section 1–5), chờ implement

## Mục tiêu

Backend go-ecommerce-app đã thay Stripe bằng PayOS. Frontend hiện vẫn gọi flow cũ
(`POST /orders/payment/intent` → `{id, client_secret}`) và hiển thị stub "Stripe payment
intent". Sửa frontend để khớp: gọi `POST /orders/payment/link`, hiển thị **QR VietQR inline**
+ nút mở **trang thanh toán PayOS** (`checkout_url`), và auto-poll trạng thái `paid`.

## Bối cảnh hiện tại (đã khảo sát)

- Stack: Vite + React 18 + TypeScript + `@tanstack/react-query` + axios + react-router-dom.
- **Không** nhúng Stripe.js — chỉ gọi API backend.
- `src/lib/api.ts`: `OrderAPI.paymentIntent(order_id)` → POST `/orders/payment/intent` → `{id, client_secret}`.
- `src/pages/OrderDetail.tsx`: nút "Pay by card" gọi `paymentIntent`, lưu `intentInfo` state, hiển thị
  intent id + text Stripe. Đã có `useQueryClient` + `invalidateQueries({queryKey:["orders", id]})`.
- `src/lib/types.ts`: `Order.payment_intent_id?`, `PaymentStatus`.
- `src/pages/Checkout.tsx`, `src/pages/Orders.tsx`: có text "Stripe".
- Router (`src/App.tsx`): `<Routes>` với các `<Route path=...>`; order detail tại `/orders/:id`.

## Quyết định đã chốt

- **UX thanh toán:** hiển thị **cả** QR inline **và** nút mở `checkout_url` (fallback).
- **QR rendering:** thêm dependency `qrcode.react` (render chuỗi VietQR, không gọi mạng).
- **Phát hiện đã trả tiền:** auto-poll order bằng React Query `refetchInterval` (~4s) khi đang pending.
- `payment_intent_id` giữ nguyên tên (backend vẫn trả field này, nay chứa PayOS `paymentLinkId`).

## Phạm vi & files

- `src/lib/types.ts` — thêm type `PaymentLink`.
- `src/lib/api.ts` — `paymentIntent` → `createPaymentLink` (endpoint + response type).
- `src/pages/OrderDetail.tsx` — thay UI thanh toán: QR + nút PayOS + auto-poll.
- `src/App.tsx` — thêm route `/payment/success` + `/payment/cancel`.
- `src/pages/PaymentResult.tsx` (mới) — trang success/cancel dùng chung.
- `src/pages/Checkout.tsx`, `src/pages/Orders.tsx` — đổi text Stripe → PayOS.
- `package.json` — thêm `qrcode.react`.

## Thiết kế chi tiết

### Tầng API + types

```ts
// src/lib/types.ts
export type PaymentLink = {
  checkout_url: string;
  qr_code: string;        // chuỗi VietQR (EMVCo payload)
  payment_link_id: string;
  order_code: number;
  amount: number;         // VND
};
```

```ts
// src/lib/api.ts — thay paymentIntent
createPaymentLink: (order_id: number) =>
  api
    .post<APIResponse<PaymentLink>>("/orders/payment/link", { order_id })
    .then((r) => r.data.data),
```
Xóa hàm `paymentIntent` và type `{id, client_secret}`.

### OrderDetail — UI thanh toán

Khi `order.payment_status === "pending"` và đơn chưa hủy:
- Nút **"Thanh toán qua PayOS"** → `createPaymentLink(order.id)` → lưu `PaymentLink` vào state `link`.
- Khi có `link`: render
  - `<QRCodeSVG value={link.qr_code} size={200} />` (từ `qrcode.react`),
  - dòng số tiền `link.amount` định dạng VND,
  - nút/anchor **"Mở trang thanh toán PayOS"** → `link.checkout_url` (tab mới, `rel="noopener"`).
- **Auto-poll:** order được fetch bằng `useQuery({ queryKey:["orders", id], ... })`. Thêm
  `refetchInterval: (q) => q.state.data?.payment_status === "pending" ? 4000 : false` để khi
  webhook flip sang `paid`, UI tự cập nhật rồi dừng poll.
- Khi `payment_status === "paid"`: hiện "✓ Đã thanh toán", ẩn nút.
- Gỡ state `intentInfo`, `paying`-text "Contacting Stripe", và mọi text Stripe.

### Route success/cancel

- `src/pages/PaymentResult.tsx`: nhận một prop/biến `status: "success" | "cancel"`; hiển thị thông báo
  tương ứng + nút "Về đơn hàng" (`/orders`). Ở success, `invalidateQueries({queryKey:["orders"]})`
  để danh sách/đơn cập nhật.
- `src/App.tsx`: thêm
  - `<Route path="/payment/success" element={<PaymentResult status="success" />} />`
  - `<Route path="/payment/cancel" element={<PaymentResult status="cancel" />} />`

### Dọn text

- `Checkout.tsx`: "Orders are placed first, then settled by card via Stripe from the order page."
  → "Đơn được tạo trước, rồi thanh toán qua PayOS (VietQR) từ trang đơn hàng."
- `Orders.tsx`: gỡ chữ Stripe nếu có (PaymentBadge logic không đổi).

## Lưu ý cấu hình (ngoài frontend, cần làm để chạy thật)

⚠️ Backend `.env`: `PAYOS_RETURN_URL` / `PAYOS_CANCEL_URL` phải trỏ về **origin của frontend**
(vd `http://localhost:5173/payment/success` và `/payment/cancel`), KHÔNG phải backend `:9000`.
Đây là nơi PayOS redirect khách về sau khi thanh toán qua `checkout_url`.

## Phạm vi loại trừ (YAGNI)

- Không xử lý refund/cancel payment ở frontend (ngoài route hiển thị).
- Không tự verify webhook ở frontend (đó là việc backend).
- Không thêm state management mới — dùng React Query sẵn có.

## Tiêu chí thành công

- `npm run build` (tsc + vite) sạch.
- Trang order: nút PayOS → hiện QR + nút mở trang PayOS; sau khi trả tiền, trạng thái tự
  chuyển "✓ Đã thanh toán" nhờ auto-poll.
- Không còn chữ "Stripe" / `client_secret` / `/orders/payment/intent` nào trong `src/`.
- Route `/payment/success` + `/payment/cancel` hoạt động.
