import { AnimatePresence, motion } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCart, useRemoveCartItem } from "../lib/hooks";
import { useAuth } from "../context/AuthContext";
import { CartAPI, errorMessage } from "../lib/api";
import { useToast } from "../context/ToastContext";
import { cartTotal, money, pad } from "../lib/format";
import ProductImage from "./ProductImage";
import { Button } from "./Field";

export default function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { authenticated } = useAuth();
  const { data: cart, isLoading } = useCart();
  const removeItem = useRemoveCartItem();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  // The API increments quantity on POST, so "+" posts qty 1 and "−" must
  // remove the line and re-add it with the reduced quantity.
  const adjustQty = useMutation({
    mutationFn: async ({
      itemId,
      productId,
      currentQty,
      delta,
    }: {
      itemId: number;
      productId: number;
      currentQty: number;
      delta: number;
    }) => {
      if (delta > 0) {
        await CartAPI.add(productId, delta);
      } else {
        const next = currentQty + delta;
        await CartAPI.remove(itemId);
        if (next >= 1) await CartAPI.add(productId, next);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
    onError: (err) => toast(errorMessage(err), "err"),
  });

  const items = cart?.items ?? [];
  const total = cartTotal(items);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-ink/50 backdrop-blur-[2px]"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col border-l border-ink bg-paper"
          >
            <div className="flex items-center justify-between border-b border-ink px-5 py-4">
              <h2 className="font-display text-xl font-bold">
                Your cart <span className="wonky-italic text-vermillion">({items.length})</span>
              </h2>
              <button onClick={onClose} className="label-mono cursor-pointer hover:text-vermillion">
                Close ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {!authenticated ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
                  <p className="wonky-italic text-2xl">The cart awaits a name.</p>
                  <p className="text-sm text-ink-soft">Sign in to begin your order.</p>
                  <Link to="/login" onClick={onClose}>
                    <Button>Sign in</Button>
                  </Link>
                </div>
              ) : isLoading ? (
                <p className="label-mono animate-pulse p-6">Loading…</p>
              ) : items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
                  <p className="wonky-italic text-2xl">Empty, for now.</p>
                  <Link to="/shop" onClick={onClose}>
                    <Button variant="outline">Browse the catalogue</Button>
                  </Link>
                </div>
              ) : (
                <ul>
                  {items.map((item) => (
                    <li key={item.id} className="flex gap-4 border-b border-rule px-5 py-4">
                      <Link
                        to={`/products/${item.product_id}`}
                        onClick={onClose}
                        className="block h-24 w-20 shrink-0 overflow-hidden border border-ink"
                      >
                        {item.product && <ProductImage product={item.product} />}
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate font-display font-semibold">
                            {item.product?.name ?? `№ ${pad(item.product_id)}`}
                          </p>
                          <p className="shrink-0 font-mono text-sm">{money(item.price * item.quantity)}</p>
                        </div>
                        <p className="label-mono mt-0.5 text-ink-soft">{money(item.price)} each</p>
                        <div className="mt-auto flex items-center justify-between pt-2">
                          <div className="flex items-center border border-ink">
                            <button
                              onClick={() =>
                                adjustQty.mutate({
                                  itemId: item.id,
                                  productId: item.product_id,
                                  currentQty: item.quantity,
                                  delta: -1,
                                })
                              }
                              disabled={adjustQty.isPending || item.quantity <= 1}
                              className="cursor-pointer px-3 py-1 font-mono text-sm hover:bg-ink hover:text-paper disabled:opacity-40"
                            >
                              −
                            </button>
                            <span className="border-x border-ink px-3 py-1 font-mono text-sm">{item.quantity}</span>
                            <button
                              onClick={() =>
                                adjustQty.mutate({
                                  itemId: item.id,
                                  productId: item.product_id,
                                  currentQty: item.quantity,
                                  delta: +1,
                                })
                              }
                              disabled={adjustQty.isPending}
                              className="cursor-pointer px-3 py-1 font-mono text-sm hover:bg-ink hover:text-paper disabled:opacity-40"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem.mutate(item.id)}
                            disabled={removeItem.isPending}
                            className="label-mono cursor-pointer text-ink-soft hover:text-vermillion"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {authenticated && items.length > 0 && (
              <div className="border-t border-ink p-5">
                <div className="mb-4 flex items-baseline justify-between">
                  <span className="label-mono text-ink-soft">Subtotal</span>
                  <span className="font-mono text-lg">{money(total)}</span>
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    onClose();
                    navigate("/checkout");
                  }}
                >
                  Proceed to checkout →
                </Button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
