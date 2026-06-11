import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import Reveal from "../components/Reveal";
import { Button, Field } from "../components/Field";
import { useCategories, useProducts } from "../lib/hooks";
import type { ProductFilters } from "../lib/types";

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [minPrice, setMinPrice] = useState(params.get("min_price") ?? "");
  const [maxPrice, setMaxPrice] = useState(params.get("max_price") ?? "");
  const [search, setSearch] = useState(params.get("search") ?? "");

  const filters: ProductFilters = useMemo(
    () => ({
      category_id: params.get("category_id") ? Number(params.get("category_id")) : undefined,
      min_price: params.get("min_price") ? Number(params.get("min_price")) : undefined,
      max_price: params.get("max_price") ? Number(params.get("max_price")) : undefined,
      search: params.get("search") ?? undefined,
      page: params.get("page") ? Number(params.get("page")) : 1,
      limit: 12,
    }),
    [params],
  );

  const { data, isLoading, isError } = useProducts(filters);
  const { data: categories } = useCategories();
  const products = data?.data ?? [];
  const meta = data?.meta;

  const updateParams = (patch: Record<string, string | undefined>, resetPage = true) => {
    const next = new URLSearchParams(params);
    if (resetPage) next.delete("page");
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === "") next.delete(k);
      else next.set(k, v);
    }
    setParams(next);
  };

  const applyRefinements = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ search: search || undefined, min_price: minPrice || undefined, max_price: maxPrice || undefined });
  };

  const activeCategory = filters.category_id;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Reveal>
        <p className="label-mono mb-2 text-ink-soft">The Catalogue</p>
        <h1 className="font-display text-5xl font-black tracking-tight sm:text-6xl">
          Every good, <span className="wonky-italic text-vermillion">indexed</span>
        </h1>
      </Reveal>

      <div className="mt-10 grid gap-10 lg:grid-cols-[240px_1fr]">
        {/* ——— Refinements rail ——— */}
        <aside className="lg:rule-t lg:pt-6">
          <form onSubmit={applyRefinements} className="space-y-6">
            <div>
              <p className="label-mono mb-3 text-ink-soft">Department</p>
              <ul className="space-y-1.5">
                <li>
                  <button
                    type="button"
                    onClick={() => updateParams({ category_id: undefined })}
                    className={`label-mono link-underline cursor-pointer ${!activeCategory ? "text-vermillion" : "text-ink"}`}
                  >
                    All departments
                  </button>
                </li>
                {(categories ?? []).map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => updateParams({ category_id: String(c.id) })}
                      className={`label-mono link-underline cursor-pointer ${activeCategory === c.id ? "text-vermillion" : "text-ink"}`}
                    >
                      {c.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <Field
              label="Search"
              placeholder="e.g. lamp, chair…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Min $"
                type="number"
                min="0"
                step="0.01"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <Field
                label="Max $"
                type="number"
                min="0"
                step="0.01"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Refine
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setMinPrice("");
                  setMaxPrice("");
                  setParams(new URLSearchParams());
                }}
              >
                Clear
              </Button>
            </div>
          </form>
        </aside>

        {/* ——— Results ——— */}
        <div>
          <div className="rule-b mb-6 flex items-baseline justify-between pb-3">
            <p className="label-mono text-ink-soft">
              {meta ? `${meta.total} item${meta.total === 1 ? "" : "s"}` : "…"}
              {filters.search && (
                <>
                  {" "}— matching <span className="text-vermillion">“{filters.search}”</span>
                </>
              )}
            </p>
            {meta && meta.pages > 1 && (
              <p className="label-mono text-ink-soft">
                Page {meta.page} / {meta.pages}
              </p>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] animate-pulse border border-rule bg-paper-deep" />
              ))}
            </div>
          ) : isError ? (
            <div className="border border-vermillion px-6 py-16 text-center">
              <p className="wonky-italic text-2xl text-vermillion">The catalogue is unreachable.</p>
              <p className="mt-2 text-sm text-ink-soft">Check that the API is running on port 9000.</p>
            </div>
          ) : products.length === 0 ? (
            <div className="border border-dashed border-ink/40 px-6 py-20 text-center">
              <p className="wonky-italic text-3xl">Nothing under this heading.</p>
              <p className="mt-3 text-sm text-ink-soft">Try clearing the refinements.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {meta && meta.pages > 1 && (
            <div className="rule-t mt-10 flex items-center justify-between pt-5">
              <button
                disabled={meta.page <= 1}
                onClick={() => updateParams({ page: String(meta.page - 1) }, false)}
                className="label-mono cursor-pointer disabled:opacity-30"
              >
                ← Previous
              </button>
              <div className="flex gap-2">
                {Array.from({ length: meta.pages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => updateParams({ page: String(p) }, false)}
                    className={`label-mono h-8 w-8 cursor-pointer border transition-colors ${
                      p === meta.page
                        ? "border-ink bg-ink text-paper"
                        : "border-rule hover:border-ink"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                disabled={meta.page >= meta.pages}
                onClick={() => updateParams({ page: String(meta.page + 1) }, false)}
                className="label-mono cursor-pointer disabled:opacity-30"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
