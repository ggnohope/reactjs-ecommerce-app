import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Reveal from "../components/Reveal";
import { Button, Field } from "../components/Field";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../lib/api";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-0">
      <Reveal className="lg:border-r lg:border-ink lg:pr-12">
        <p className="label-mono mb-4 text-vermillion">The ledger</p>
        <h1 className="font-display text-5xl font-black tracking-tight">
          Welcome
          <br />
          <span className="wonky-italic font-medium">back.</span>
        </h1>
        <p className="mt-6 max-w-sm text-ink-soft">
          Sign in to your account to review orders, keep a cart, and — should you be so
          inclined — sell your own goods.
        </p>
      </Reveal>

      <Reveal delay={0.12} className="lg:pl-12">
        <form onSubmit={submit} className="space-y-5">
          <Field
            label="Email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Field
            label="Password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <p className="border border-vermillion bg-vermillion/10 px-3 py-2 font-mono text-xs text-vermillion">
              ▲ {error}
            </p>
          )}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Signing in…" : "Sign in →"}
          </Button>
          <p className="label-mono text-center text-ink-soft">
            No account yet?{" "}
            <Link to="/register" className="link-underline text-vermillion">
              Register
            </Link>
          </p>
        </form>
      </Reveal>
    </div>
  );
}
