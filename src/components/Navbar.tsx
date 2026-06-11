import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../lib/hooks";
import { cartCount } from "../lib/format";

const navLink = ({ isActive }: { isActive: boolean }) =>
  `label-mono link-underline pb-0.5 transition-colors ${isActive ? "text-vermillion" : "text-ink hover:text-vermillion"}`;

export default function Navbar({ onOpenCart }: { onOpenCart: () => void }) {
  const { authenticated, user, isSeller, logout } = useAuth();
  const { data: cart } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const count = cartCount(cart?.items);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-ink bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-stretch justify-between px-4 sm:px-6">
        {/* Wordmark */}
        <Link to="/" className="flex items-center gap-3 py-3">
          <span className="font-display text-2xl font-black tracking-tight">
            VERSO<span className="text-vermillion">.</span>
          </span>
          <span className="label-mono hidden text-ink-soft md:block">est. mmxxvi</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          <NavLink to="/shop" className={navLink}>
            Catalogue
          </NavLink>
          {authenticated && (
            <NavLink to="/orders" className={navLink}>
              Orders
            </NavLink>
          )}
          {isSeller && (
            <NavLink to="/seller" className={navLink}>
              Atelier
            </NavLink>
          )}
          {authenticated ? (
            <NavLink to="/account" className={navLink}>
              {user?.first_name ? user.first_name : "Account"}
              {user && !user.verified && <span className="ml-1 text-vermillion">●</span>}
            </NavLink>
          ) : (
            <NavLink to="/login" className={navLink}>
              Sign in
            </NavLink>
          )}
          {authenticated && (
            <button onClick={handleLogout} className="label-mono link-underline cursor-pointer text-ink-soft hover:text-vermillion">
              Exit
            </button>
          )}
          <button
            onClick={onOpenCart}
            className="group relative -my-px flex cursor-pointer items-center gap-2 border-l border-ink bg-ink px-5 text-paper transition-colors hover:bg-vermillion"
            aria-label="Open cart"
          >
            <span className="label-mono">Cart</span>
            <span className="label-mono flex h-5 w-5 items-center justify-center rounded-full bg-paper text-[10px] text-ink">
              {count}
            </span>
          </button>
        </nav>

        {/* Mobile controls */}
        <div className="flex items-center gap-4 md:hidden">
          <button onClick={onOpenCart} className="label-mono relative cursor-pointer" aria-label="Open cart">
            Cart [{count}]
          </button>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="label-mono cursor-pointer"
            aria-label="Toggle menu"
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-rule md:hidden"
          >
            <div className="flex flex-col gap-4 px-6 py-5">
              <NavLink to="/shop" className={navLink} onClick={() => setMenuOpen(false)}>
                Catalogue
              </NavLink>
              {authenticated && (
                <NavLink to="/orders" className={navLink} onClick={() => setMenuOpen(false)}>
                  Orders
                </NavLink>
              )}
              {isSeller && (
                <NavLink to="/seller" className={navLink} onClick={() => setMenuOpen(false)}>
                  Atelier
                </NavLink>
              )}
              {authenticated ? (
                <>
                  <NavLink to="/account" className={navLink} onClick={() => setMenuOpen(false)}>
                    Account
                  </NavLink>
                  <button onClick={handleLogout} className="label-mono cursor-pointer text-left text-ink-soft">
                    Exit
                  </button>
                </>
              ) : (
                <NavLink to="/login" className={navLink} onClick={() => setMenuOpen(false)}>
                  Sign in
                </NavLink>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
