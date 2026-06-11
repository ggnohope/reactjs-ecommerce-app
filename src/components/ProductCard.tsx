import { Link } from "react-router-dom";
import { motion } from "motion/react";
import type { Product } from "../lib/types";
import { money, pad } from "../lib/format";
import ProductImage from "./ProductImage";
import { useAddToCart } from "../lib/hooks";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const addToCart = useAddToCart();
  const { authenticated } = useAuth();
  const navigate = useNavigate();
  const soldOut = product.stock <= 0;

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!authenticated) {
      navigate("/login");
      return;
    }
    addToCart.mutate({ productId: product.id, quantity: 1 });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.07, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        to={`/products/${product.id}`}
        className="group block border border-ink bg-paper transition-shadow duration-300 hover:shadow-block"
      >
        <div className="relative aspect-[4/5] overflow-hidden border-b border-ink">
          <div className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-105">
            <ProductImage product={product} />
          </div>
          <span className="label-mono absolute left-3 top-3 bg-paper px-2 py-1 text-ink">
            № {pad(product.id)}
          </span>
          {soldOut && (
            <span className="label-mono absolute right-3 top-3 bg-ink px-2 py-1 text-paper">
              Sold out
            </span>
          )}
          {!soldOut && (
            <button
              onClick={quickAdd}
              disabled={addToCart.isPending}
              className="label-mono absolute inset-x-0 bottom-0 translate-y-full cursor-pointer bg-ink py-3 text-center text-paper opacity-0 transition-all duration-300 hover:bg-vermillion disabled:opacity-60 group-hover:translate-y-0 group-hover:opacity-100"
            >
              {addToCart.isPending ? "Adding…" : "Quick add +"}
            </button>
          )}
        </div>
        <div className="flex items-baseline justify-between gap-2 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-semibold">{product.name}</p>
            <p className="label-mono mt-0.5 text-ink-soft">{product.category?.name ?? "—"}</p>
          </div>
          <p className="shrink-0 font-mono text-sm">{money(product.price)}</p>
        </div>
      </Link>
    </motion.div>
  );
}
