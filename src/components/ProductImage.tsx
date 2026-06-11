import type { Product } from "../lib/types";

// Deterministic editorial placeholder for products without uploaded images:
// a duotone "plate" with the product's initial set in Fraunces, varied by id.
const PLATES = [
  { bg: "#E5DCC9", fg: "#191512" },
  { bg: "#191512", fg: "#F4EFE6" },
  { bg: "#C03B12", fg: "#F4EFE6" },
  { bg: "#5F6347", fg: "#F4EFE6" },
  { bg: "#A87B2D", fg: "#191512" },
];

export default function ProductImage({
  product,
  className = "",
}: {
  product: Product;
  className?: string;
}) {
  const url = product.images?.[0]?.url;

  if (url) {
    return (
      <img
        src={url}
        alt={product.name}
        loading="lazy"
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  const plate = PLATES[product.id % PLATES.length];
  const initial = (product.name || "?").charAt(0).toUpperCase();

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden ${className}`}
      style={{ backgroundColor: plate.bg, color: plate.fg }}
      aria-label={product.name}
    >
      {/* concentric ring etching */}
      <svg className="absolute inset-0 h-full w-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        {[12, 22, 32, 42, 52].map((r) => (
          <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="0.4" />
        ))}
      </svg>
      <span className="font-display select-none text-[5rem] font-black italic leading-none" style={{ fontVariationSettings: '"SOFT" 60, "WONK" 1' }}>
        {initial}
      </span>
      <span className="label-mono absolute bottom-3 left-3 opacity-60">
        plate № {String(product.id).padStart(3, "0")}
      </span>
    </div>
  );
}
