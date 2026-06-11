import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Reveal from "../components/Reveal";
import ProductImage from "../components/ProductImage";
import { Button, Field } from "../components/Field";
import { useAddresses, useCart } from "../lib/hooks";
import { AddressAPI, errorMessage, OrderAPI } from "../lib/api";
import { useToast } from "../context/ToastContext";
import { cartTotal, money } from "../lib/format";
import type { Address } from "../lib/types";

const emptyAddress = {
  street: "",
  city: "",
  state: "",
  postal_code: "",
  country: "",
  is_default: false,
};

function formatAddress(a: Address): string {
  return [a.street, a.city, a.state, a.postal_code, a.country].filter(Boolean).join(", ");
}

export default function Checkout() {
  const { data: cart, isLoading: cartLoading } = useCart();
  const { data: addresses, isLoading: addressesLoading } = useAddresses();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  const items = cart?.items ?? [];
  const total = cartTotal(items);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyAddress);

  // Preselect the default (or first) address once loaded.
  useEffect(() => {
    if (selectedId === null && addresses && addresses.length > 0) {
      const def = addresses.find((a) => a.is_default) ?? addresses[0];
      setSelectedId(def.id);
    }
    if (addresses && addresses.length === 0) setShowForm(true);
  }, [addresses, selectedId]);

  const selectedAddress = useMemo(
    () => addresses?.find((a) => a.id === selectedId) ?? null,
    [addresses, selectedId],
  );

  const saveAddress = useMutation({
    mutationFn: () => AddressAPI.create(form),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      setSelectedId(created.id);
      setShowForm(false);
      setForm(emptyAddress);
      toast("Address saved");
    },
    onError: (err) => toast(errorMessage(err), "err"),
  });

  const placeOrder = useMutation({
    mutationFn: (shipping: string) => OrderAPI.place(shipping),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast(`Order № ${order.id} placed`);
      navigate(`/orders/${order.id}`);
    },
    onError: (err) => toast(errorMessage(err), "err"),
  });

  if (cartLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span className="label-mono animate-pulse">Preparing checkout…</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="wonky-italic text-4xl">Nothing to check out.</p>
        <Link to="/shop" className="label-mono link-underline mt-6 inline-block text-vermillion">
          ← Back to the catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Reveal>
        <p className="label-mono mb-2 text-ink-soft">The counter</p>
        <h1 className="font-display text-5xl font-black tracking-tight">
          Check<span className="wonky-italic font-medium text-vermillion">out.</span>
        </h1>
      </Reveal>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        {/* ——— Shipping ——— */}
        <Reveal delay={0.1}>
          <section className="border border-ink">
            <header className="rule-b flex items-center justify-between px-5 py-4">
              <h2 className="font-display text-xl font-bold">1 · Shipping address</h2>
              {!showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="label-mono cursor-pointer text-vermillion hover:underline"
                >
                  + New address
                </button>
              )}
            </header>

            <div className="p-5">
              {addressesLoading ? (
                <p className="label-mono animate-pulse">Loading addresses…</p>
              ) : (
                <>
                  {(addresses ?? []).length > 0 && (
                    <ul className="mb-5 space-y-3">
                      {addresses!.map((a) => (
                        <li key={a.id}>
                          <label
                            className={`flex cursor-pointer items-start gap-3 border p-4 transition-all ${
                              selectedId === a.id
                                ? "border-ink bg-paper-deep shadow-block-sm"
                                : "border-rule hover:border-ink"
                            }`}
                          >
                            <input
                              type="radio"
                              name="address"
                              checked={selectedId === a.id}
                              onChange={() => setSelectedId(a.id)}
                              className="mt-1 accent-[#C03B12]"
                            />
                            <span>
                              <span className="block text-sm">{formatAddress(a)}</span>
                              {a.is_default && (
                                <span className="label-mono mt-1 inline-block bg-ink px-1.5 py-0.5 text-paper">
                                  Default
                                </span>
                              )}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}

                  {showForm && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        saveAddress.mutate();
                      }}
                      className="rule-t space-y-4 pt-5"
                    >
                      <p className="label-mono text-ink-soft">New address</p>
                      <Field
                        label="Street"
                        required
                        value={form.street}
                        onChange={(e) => setForm({ ...form, street: e.target.value })}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Field
                          label="City"
                          required
                          value={form.city}
                          onChange={(e) => setForm({ ...form, city: e.target.value })}
                        />
                        <Field
                          label="State / Province"
                          value={form.state}
                          onChange={(e) => setForm({ ...form, state: e.target.value })}
                        />
                        <Field
                          label="Postal code"
                          required
                          value={form.postal_code}
                          onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                        />
                        <Field
                          label="Country"
                          required
                          value={form.country}
                          onChange={(e) => setForm({ ...form, country: e.target.value })}
                        />
                      </div>
                      <label className="label-mono flex cursor-pointer items-center gap-2 text-ink-soft">
                        <input
                          type="checkbox"
                          checked={form.is_default}
                          onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                          className="accent-[#C03B12]"
                        />
                        Set as default
                      </label>
                      <div className="flex gap-3">
                        <Button type="submit" disabled={saveAddress.isPending}>
                          {saveAddress.isPending ? "Saving…" : "Save address"}
                        </Button>
                        {(addresses ?? []).length > 0 && (
                          <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                            Cancel
                          </Button>
                        )}
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          </section>

          <section className="mt-6 border border-ink">
            <header className="rule-b px-5 py-4">
              <h2 className="font-display text-xl font-bold">2 · Payment</h2>
            </header>
            <div className="p-5">
              <p className="text-sm text-ink-soft">
                Orders are placed first, then settled by card via Stripe from the order page.
                If payments are not configured on the server, your order simply remains
                <span className="font-mono"> pending</span> — nothing is charged.
              </p>
            </div>
          </section>
        </Reveal>

        {/* ——— Summary ——— */}
        <Reveal delay={0.18}>
          <aside className="sticky top-20 border border-ink bg-paper-deep shadow-block">
            <header className="rule-b px-5 py-4">
              <h2 className="font-display text-xl font-bold">Order summary</h2>
            </header>
            <ul className="max-h-72 overflow-y-auto">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 border-b border-rule px-5 py-3">
                  <div className="h-14 w-11 shrink-0 overflow-hidden border border-ink">
                    {item.product && <ProductImage product={item.product} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.product?.name}</p>
                    <p className="label-mono text-ink-soft">× {item.quantity}</p>
                  </div>
                  <p className="font-mono text-sm">{money(item.price * item.quantity)}</p>
                </li>
              ))}
            </ul>
            <div className="space-y-2 px-5 py-4">
              <div className="flex justify-between text-sm text-ink-soft">
                <span>Subtotal</span>
                <span className="font-mono">{money(total)}</span>
              </div>
              <div className="flex justify-between text-sm text-ink-soft">
                <span>Shipping</span>
                <span className="font-mono">Gratis</span>
              </div>
              <div className="rule-t flex justify-between pt-3 text-lg">
                <span className="font-display font-bold">Total</span>
                <span className="font-mono">{money(total)}</span>
              </div>
            </div>
            <div className="px-5 pb-5">
              <Button
                className="w-full"
                disabled={!selectedAddress || placeOrder.isPending}
                onClick={() => selectedAddress && placeOrder.mutate(formatAddress(selectedAddress))}
              >
                {placeOrder.isPending
                  ? "Placing order…"
                  : selectedAddress
                    ? `Place order — ${money(total)}`
                    : "Select an address first"}
              </Button>
            </div>
          </aside>
        </Reveal>
      </div>
    </div>
  );
}
