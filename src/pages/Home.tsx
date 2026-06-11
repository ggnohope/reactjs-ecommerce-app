import { Link } from "react-router-dom";
import { motion } from "motion/react";
import Marquee from "../components/Marquee";
import ProductCard from "../components/ProductCard";
import Reveal from "../components/Reveal";
import { useCategories, useProducts } from "../lib/hooks";

export default function Home() {
  const { data: productsRes } = useProducts({ limit: 8 });
  const { data: categories } = useCategories();
  const products = productsRes?.data ?? [];

  return (
    <div>
      {/* ——— Hero ——— */}
      <section className="relative overflow-hidden rule-b">
        <div className="mx-auto grid max-w-7xl gap-0 px-4 sm:px-6 lg:grid-cols-12">
          <div className="relative z-10 py-20 lg:col-span-8 lg:py-28">
            <Reveal>
              <p className="label-mono mb-6 text-vermillion">№ 01 — The Catalogue · Summer MMXXVI</p>
            </Reveal>
            <Reveal delay={0.08}>
              <h1 className="font-display text-balance text-6xl font-black leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
                Goods of
                <br />
                <span className="wonky-italic font-medium text-vermillion">considered</span>
                <br />
                origin.
              </h1>
            </Reveal>
            <Reveal delay={0.18}>
              <p className="mt-8 max-w-md text-base leading-relaxed text-ink-soft">
                VERSO is a department store in the editorial tradition — every object
                indexed, every maker named, every price set in monospace.
              </p>
            </Reveal>
            <Reveal delay={0.26} className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                to="/shop"
                className="label-mono group inline-flex items-center gap-3 bg-ink px-7 py-4 text-paper transition-colors hover:bg-vermillion"
              >
                Browse the catalogue
                <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
              </Link>
              <Link to="/register" className="label-mono link-underline py-4 text-ink hover:text-vermillion">
                Open an account
              </Link>
            </Reveal>
          </div>

          {/* Decorative plate column */}
          <div className="relative hidden lg:col-span-4 lg:block">
            <motion.div
              initial={{ opacity: 0, rotate: -4, y: 40 }}
              animate={{ opacity: 1, rotate: 3, y: 0 }}
              transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="absolute right-0 top-16 h-[420px] w-[320px] border border-ink bg-paper-deep shadow-block"
            >
              <div className="flex h-full flex-col justify-between p-6">
                <span className="label-mono">fig. 1 — the storefront</span>
                <svg viewBox="0 0 100 100" className="mx-auto w-44 animate-drift text-ink">
                  <rect x="18" y="34" width="64" height="48" fill="none" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M14 34 L50 14 L86 34" fill="none" stroke="currentColor" strokeWidth="1.4" />
                  <rect x="42" y="56" width="16" height="26" fill="currentColor" />
                  <circle cx="50" cy="24" r="3" fill="#C03B12" stroke="none" />
                </svg>
                <p className="wonky-italic text-center text-xl">“Everything in its index.”</p>
              </div>
            </motion.div>
            {/* Spinning seal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.55 }}
              className="absolute bottom-10 left-4 h-28 w-28"
            >
              <svg viewBox="0 0 100 100" className="animate-spin-slow h-full w-full">
                <defs>
                  <path id="circlePath" d="M 50 50 m -38 0 a 38 38 0 1 1 76 0 a 38 38 0 1 1 -76 0" />
                </defs>
                <circle cx="50" cy="50" r="48" fill="#C03B12" />
                <circle cx="50" cy="50" r="26" fill="none" stroke="#F4EFE6" strokeWidth="1" />
                <text fill="#F4EFE6" fontSize="10.5" fontFamily="Spline Sans Mono, monospace" letterSpacing="2.5">
                  <textPath href="#circlePath">VERSO · GOODS · CONSIDERED · ORIGIN ·</textPath>
                </text>
                <text x="50" y="56" textAnchor="middle" fill="#F4EFE6" fontSize="18" fontFamily="Fraunces, serif" fontStyle="italic">
                  V.
                </text>
              </svg>
            </motion.div>
          </div>
        </div>
      </section>

      <Marquee />

      {/* ——— Categories strip ——— */}
      {(categories?.length ?? 0) > 0 && (
        <section className="rule-b">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
            <p className="label-mono mb-5 text-ink-soft">№ 02 — Departments</p>
            <div className="flex flex-wrap gap-3">
              {categories!.map((c, i) => (
                <motion.span
                  key={c.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={`/shop?category_id=${c.id}`}
                    className="label-mono inline-block border border-ink px-4 py-2 transition-all hover:bg-ink hover:text-paper hover:shadow-block-sm"
                  >
                    {c.name}
                  </Link>
                </motion.span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ——— Latest arrivals ——— */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label-mono mb-2 text-ink-soft">№ 03 — Latest arrivals</p>
            <h2 className="font-display text-4xl font-bold">
              Fresh off the <span className="wonky-italic text-vermillion">press</span>
            </h2>
          </div>
          <Link to="/shop" className="label-mono link-underline pb-1 hover:text-vermillion">
            View all →
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="border border-dashed border-ink/40 px-6 py-20 text-center">
            <p className="wonky-italic text-3xl">The shelves are being stocked.</p>
            <p className="mt-3 text-sm text-ink-soft">
              No products yet — sellers can open an atelier and list the first goods.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* ——— Sell with us band ——— */}
      <section className="border-t border-ink bg-paper-deep">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2">
          <div>
            <p className="label-mono mb-3 text-vermillion">№ 04 — For makers</p>
            <h2 className="font-display text-4xl font-bold leading-tight">
              Have something worth <span className="wonky-italic">cataloguing?</span>
            </h2>
            <p className="mt-4 max-w-md text-ink-soft">
              Open an atelier, list your goods, manage stock, and ship to readers of the
              catalogue. Upgrading takes one click from your account page.
            </p>
          </div>
          <div className="lg:justify-self-end">
            <Link
              to="/account"
              className="label-mono group inline-flex items-center gap-3 border border-ink bg-paper px-7 py-4 transition-all hover:shadow-block"
            >
              Become a seller
              <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
