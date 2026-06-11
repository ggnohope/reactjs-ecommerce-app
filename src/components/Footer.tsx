import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-ink bg-ink text-paper">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <p className="label-mono mb-3 text-paper/50">The House</p>
            <p className="max-w-xs text-sm text-paper/80">
              VERSO is a department store in the editorial tradition — considered goods,
              catalogued with care, shipped without ceremony.
            </p>
          </div>
          <div>
            <p className="label-mono mb-3 text-paper/50">Index</p>
            <ul className="space-y-2 text-sm">
              <li><Link to="/shop" className="link-underline text-paper/80 hover:text-paper">Catalogue</Link></li>
              <li><Link to="/orders" className="link-underline text-paper/80 hover:text-paper">Orders</Link></li>
              <li><Link to="/account" className="link-underline text-paper/80 hover:text-paper">Account</Link></li>
              <li><Link to="/seller" className="link-underline text-paper/80 hover:text-paper">Sell with us</Link></li>
            </ul>
          </div>
          <div>
            <p className="label-mono mb-3 text-paper/50">Colophon</p>
            <p className="text-sm text-paper/80">
              Set in Fraunces &amp; Libre Franklin.
              <br />
              Powered by a Go / Fiber API.
              <br />
              <span className="font-mono text-xs text-paper/50">№ 9000 · localhost edition</span>
            </p>
          </div>
        </div>
      </div>
      {/* Oversized wordmark */}
      <div className="overflow-hidden border-t border-paper/15 px-2" aria-hidden>
        <p className="font-display select-none text-center text-[18vw] font-black leading-[0.85] tracking-tighter text-paper/10">
          VERSO
        </p>
      </div>
    </footer>
  );
}
