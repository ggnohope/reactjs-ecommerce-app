import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { useAddToCart, useProduct, useProducts } from "../lib/hooks";
import { useAuth } from "../context/AuthContext";
import { money, pad } from "../lib/format";
import ProductImage from "../components/ProductImage";
import ProductCard from "../components/ProductCard";
import { Button } from "../components/Field";

export default function ProductPage({ onOpenCart }: { onOpenCart: () => void }) {
  const { id } = useParams();
  const { data: product, isLoading, isError } = useProduct(id);
  const { authenticated } = useAuth();
  const addToCart = useAddToCart();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const { data: relatedRes } = useProducts(
    product ? { category_id: product.category_id, limit: 4 } : { limit: 4 },
  );
  const related = (relatedRes?.data ?? []).filter((p) => p.id !== product?.id).slice(0, 3);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="label-mono animate-pulse">Fetching plate…</span>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <p className="wonky-italic text-4xl">This plate is missing from the catalogue.</p>
        <Link to="/shop" className="label-mono link-underline mt-6 inline-block text-vermillion">
          ← Back to the catalogue
        </Link>
      </div>
    );
  }

  const soldOut = product.stock <= 0;
  const images = product.images ?? [];

  const handleAdd = () => {
    if (!authenticated) {
      navigate("/login", { state: { from: `/products/${product.id}` } });
      return;
    }
    addToCart.mutate(
      { productId: product.id, quantity: qty },
      { onSuccess: () => onOpenCart() },
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Breadcrumb */}
      <nav className="label-mono mb-8 flex flex-wrap items-center gap-2 text-ink-soft">
        <Link to="/" className="link-underline hover:text-vermillion">Verso</Link>
        <span>/</span>
        <Link to="/shop" className="link-underline hover:text-vermillion">Catalogue</Link>
        {product.category && (
          <>
            <span>/</span>
            <Link
              to={`/shop?category_id=${product.category_id}`}
              className="link-underline hover:text-vermillion"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-ink">№ {pad(product.id)}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* ——— Plate (images) ——— */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative aspect-[4/5] overflow-hidden border border-ink shadow-block">
            {images.length > 0 ? (
              <img
                src={images[activeImage]?.url ?? images[0].url}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <ProductImage product={product} />
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-4 flex gap-3">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(i)}
                  className={`h-20 w-16 cursor-pointer overflow-hidden border transition-all ${
                    i === activeImage ? "border-ink shadow-block-sm" : "border-rule opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* ——— Entry (details) ——— */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col"
        >
          <p className="label-mono mb-3 text-vermillion">
            Entry № {pad(product.id)} · {product.category?.name ?? "Uncategorised"}
          </p>
          <h1 className="font-display text-balance text-5xl font-black leading-[1.02] tracking-tight">
            {product.name}
          </h1>

          <p className="mt-6 font-mono text-3xl">{money(product.price)}</p>

          <div className="rule-t rule-b my-7 py-5">
            <p className="whitespace-pre-line leading-relaxed text-ink-soft">
              {product.description || "No description has been set for this entry."}
            </p>
          </div>

          <dl className="mb-8 grid grid-cols-2 gap-4">
            <div>
              <dt className="label-mono text-ink-soft">Availability</dt>
              <dd className={`mt-1 font-mono text-sm ${soldOut ? "text-vermillion" : ""}`}>
                {soldOut ? "Sold out" : `${product.stock} in stock`}
              </dd>
            </div>
            <div>
              <dt className="label-mono text-ink-soft">Status</dt>
              <dd className="mt-1 font-mono text-sm capitalize">{product.status}</dd>
            </div>
          </dl>

          {!soldOut && (
            <div className="flex flex-wrap items-stretch gap-4">
              <div className="flex items-center border border-ink">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="cursor-pointer px-4 py-3 font-mono hover:bg-ink hover:text-paper"
                >
                  −
                </button>
                <span className="border-x border-ink px-5 py-3 font-mono">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                  className="cursor-pointer px-4 py-3 font-mono hover:bg-ink hover:text-paper"
                >
                  +
                </button>
              </div>
              <Button onClick={handleAdd} disabled={addToCart.isPending} className="flex-1">
                {addToCart.isPending ? "Adding…" : `Add to cart — ${money(product.price * qty)}`}
              </Button>
            </div>
          )}

          {soldOut && (
            <div className="border border-dashed border-vermillion px-5 py-4">
              <p className="wonky-italic text-xl text-vermillion">Spoken for, every last one.</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* ——— Related entries ——— */}
      {related.length > 0 && (
        <section className="mt-20">
          <div className="rule-t pt-8">
            <p className="label-mono mb-2 text-ink-soft">Adjacent entries</p>
            <h2 className="mb-8 font-display text-3xl font-bold">
              From the same <span className="wonky-italic text-vermillion">department</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
