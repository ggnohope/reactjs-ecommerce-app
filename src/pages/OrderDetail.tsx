import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import Reveal from "../components/Reveal";
import ProductImage from "../components/ProductImage";
import { Button } from "../components/Field";
import { useOrder } from "../lib/hooks";
import { errorMessage, OrderAPI } from "../lib/api";
import { useToast } from "../context/ToastContext";
import { formatDate, money, moneyVND, pad } from "../lib/format";
import type { PaymentLink } from "../lib/types";
import { PaymentBadge, StatusBadge } from "./Orders";

const STEPS = ["pending", "confirmed", "shipped", "delivered"] as const;

export default function OrderDetail() {
  const { id } = useParams();
  const { data: order, isLoading } = useOrder(id);
  const { toast } = useToast();
  const [paying, setPaying] = useState(false);
  const [link, setLink] = useState<PaymentLink | null>(null);

  const requestPayment = async () => {
    if (!order) return;
    setPaying(true);
    try {
      const paymentLink = await OrderAPI.createPaymentLink(order.id);
      setLink(paymentLink);
      toast("Đã tạo liên kết thanh toán PayOS");
    } catch (err) {
      toast(errorMessage(err), "err");
    } finally {
      setPaying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span className="label-mono animate-pulse">Opening the entry…</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="wonky-italic text-4xl">No such entry in the ledger.</p>
        <Link to="/orders" className="label-mono link-underline mt-6 inline-block text-vermillion">
          ← All orders
        </Link>
      </div>
    );
  }

  const stepIndex = STEPS.indexOf(order.status as (typeof STEPS)[number]);
  const cancelled = order.status === "cancelled";

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Link to="/orders" className="label-mono link-underline text-ink-soft hover:text-vermillion">
        ← All orders
      </Link>

      <Reveal className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-mono mb-2 text-ink-soft">Placed {formatDate(order.created_at)}</p>
          <h1 className="font-display text-5xl font-black tracking-tight">
            Order <span className="wonky-italic font-medium text-vermillion">№ {pad(order.id, 4)}</span>
          </h1>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={order.status} />
          <PaymentBadge status={order.payment_status} />
        </div>
      </Reveal>

      {/* Progress rail */}
      {!cancelled && (
        <Reveal delay={0.08} className="mt-10">
          <ol className="grid grid-cols-4 border border-ink">
            {STEPS.map((s, i) => (
              <li
                key={s}
                className={`label-mono border-r border-rule px-3 py-3 text-center last:border-r-0 ${
                  i <= stepIndex ? "bg-ink text-paper" : "text-ink-soft"
                }`}
              >
                {i + 1}. {s}
              </li>
            ))}
          </ol>
        </Reveal>
      )}

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Items */}
        <Reveal delay={0.12}>
          <section className="border border-ink">
            <header className="rule-b px-5 py-4">
              <h2 className="font-display text-xl font-bold">Items</h2>
            </header>
            <ul>
              {(order.items ?? []).map((item) => (
                <li key={item.id} className="flex items-center gap-4 border-b border-rule px-5 py-4 last:border-b-0">
                  <Link
                    to={`/products/${item.product_id}`}
                    className="block h-20 w-16 shrink-0 overflow-hidden border border-ink"
                  >
                    {item.product && <ProductImage product={item.product} />}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/products/${item.product_id}`}
                      className="font-display font-semibold hover:text-vermillion"
                    >
                      {item.product?.name ?? `Product № ${pad(item.product_id)}`}
                    </Link>
                    <p className="label-mono mt-0.5 text-ink-soft">
                      {money(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-mono">{money(item.price * item.quantity)}</p>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>

        {/* Side rail */}
        <Reveal delay={0.18} className="space-y-6">
          <section className="border border-ink bg-paper-deep p-5">
            <p className="label-mono mb-2 text-ink-soft">Total</p>
            <p className="font-mono text-3xl">{money(order.total_amount)}</p>
          </section>

          <section className="border border-ink p-5">
            <p className="label-mono mb-2 text-ink-soft">Ship to</p>
            <p className="text-sm leading-relaxed">{order.shipping_address || "—"}</p>
          </section>

          {order.payment_status === "paid" && (
            <section className="border border-ink p-5">
              <p className="text-sm font-semibold text-moss">✓ Đã thanh toán</p>
            </section>
          )}

          {order.payment_status === "pending" && !cancelled && (
            <section className="border border-ink p-5">
              <p className="label-mono mb-3 text-ink-soft">Thanh toán</p>
              {link ? (
                <div className="space-y-4">
                  <div className="flex justify-center bg-white p-3">
                    <QRCodeSVG value={link.qr_code} size={200} />
                  </div>
                  <p className="text-center text-sm">
                    Quét mã VietQR · <span className="font-mono">{moneyVND(link.amount)}</span>
                  </p>
                  <a
                    href={link.checkout_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button className="w-full" type="button">
                      Mở trang thanh toán PayOS →
                    </Button>
                  </a>
                  <p className="text-xs text-ink-soft">
                    Sau khi thanh toán, trạng thái sẽ tự cập nhật.
                  </p>
                </div>
              ) : (
                <>
                  <Button className="w-full" onClick={requestPayment} disabled={paying}>
                    {paying ? "Đang tạo liên kết…" : "Thanh toán qua PayOS →"}
                  </Button>
                  <p className="mt-2 text-xs text-ink-soft">
                    Tạo mã VietQR và liên kết thanh toán PayOS cho đơn này.
                  </p>
                </>
              )}
            </section>
          )}

          {order.payment_intent_id && (
            <section className="border border-rule p-5">
              <p className="label-mono mb-1 text-ink-soft">Payment reference</p>
              <p className="break-all font-mono text-xs">{order.payment_intent_id}</p>
            </section>
          )}
        </Reveal>
      </div>
    </div>
  );
}
