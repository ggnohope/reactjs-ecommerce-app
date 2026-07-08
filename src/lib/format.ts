const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function money(n: number | undefined | null): string {
  return usd.format(n ?? 0);
}

const vnd = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
});

export function moneyVND(n: number | undefined | null): string {
  return vnd.format(n ?? 0);
}

export function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function pad(n: number, width = 3): string {
  return String(n).padStart(width, "0");
}

export function cartCount(items?: { quantity: number }[] | null): number {
  return (items ?? []).reduce((sum, i) => sum + i.quantity, 0);
}

export function cartTotal(items?: { quantity: number; price: number }[] | null): number {
  return (items ?? []).reduce((sum, i) => sum + i.price * i.quantity, 0);
}
