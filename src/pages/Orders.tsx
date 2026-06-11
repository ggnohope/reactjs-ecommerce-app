import { Link } from "react-router-dom";
import Reveal from "../components/Reveal";
import { useOrders } from "../lib/hooks";
import { formatDate, money, pad } from "../lib/format";
import type { OrderStatus, PaymentStatus } from "../lib/types";

export function StatusBadge({ status }: { status: OrderStatus }) {
  const tone: Record<OrderStatus, string> = {
    pending: "border-gold text-gold",
    confirmed: "border-moss text-moss",
    shipped: "border-ink text-ink",
    delivered: "border-moss bg-moss text-paper",
    cancelled: "border-vermillion text-vermillion",
  };
  return (
    <span className={`label-mono inline-block border px-2 py-0.5 ${tone[status] ?? "border-ink"}`}>
      {status}
    </span>
  );
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const tone: Record<PaymentStatus, string> = {
    pending: "border-gold text-gold",
    paid: "border-moss bg-moss text-paper",
    failed: "border-vermillion text-vermillion",
    refunded: "border-ink text-ink",
  };
  return (
    <span className={`label-mono inline-block border px-2 py-0.5 ${tone[status] ?? "border-ink"}`}>
      {status}
    </span>
  );
}

export default function Orders() {
  const { data: orders, isLoading } = useOrders();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Reveal>
        <p className="label-mono mb-2 text-ink-soft">The ledger</p>
        <h1 className="font-display text-5xl font-black tracking-tight">
          Your <span className="wonky-italic font-medium text-vermillion">orders.</span>
        </h1>
      </Reveal>

      <Reveal delay={0.1} className="mt-10">
        {isLoading ? (
          <p className="label-mono animate-pulse">Opening the ledger…</p>
        ) : (orders ?? []).length === 0 ? (
          <div className="border border-dashed border-ink/40 px-6 py-20 text-center">
            <p className="wonky-italic text-3xl">No entries yet.</p>
            <Link to="/shop" className="label-mono link-underline mt-4 inline-block text-vermillion">
              → Browse the catalogue
            </Link>
          </div>
        ) : (
          <ul className="border border-ink">
            {orders!.map((o) => (
              <li key={o.id} className="border-b border-rule last:border-b-0">
                <Link
                  to={`/orders/${o.id}`}
                  className="grid grid-cols-2 items-center gap-3 px-5 py-4 transition-colors hover:bg-paper-deep sm:grid-cols-[110px_1fr_auto_auto_auto]"
                >
                  <span className="font-mono text-sm">№ {pad(o.id, 4)}</span>
                  <span className="label-mono text-ink-soft">
                    {formatDate(o.created_at)} · {(o.items ?? []).length} item
                    {(o.items ?? []).length === 1 ? "" : "s"}
                  </span>
                  <StatusBadge status={o.status} />
                  <PaymentBadge status={o.payment_status} />
                  <span className="text-right font-mono">{money(o.total_amount)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Reveal>
    </div>
  );
}
