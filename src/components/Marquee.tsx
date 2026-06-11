const ITEMS = [
  "Considered goods, catalogued",
  "Ships within two days",
  "Sellers welcome — open an atelier",
  "Printed in paper & ink",
  "Verso · recto · verso",
];

export default function Marquee() {
  const row = ITEMS.map((t, i) => (
    <span key={i} className="label-mono mx-6 inline-flex items-center gap-6 text-paper">
      {t} <span className="text-vermillion">◆</span>
    </span>
  ));
  return (
    <div className="overflow-hidden border-y border-ink bg-ink py-2.5">
      <div className="animate-marquee inline-flex whitespace-nowrap will-change-transform">
        <div className="inline-flex">{row}</div>
        <div className="inline-flex" aria-hidden>{row}</div>
      </div>
    </div>
  );
}
