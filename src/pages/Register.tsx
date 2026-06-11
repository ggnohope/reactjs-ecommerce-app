import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Reveal from "../components/Reveal";
import { Button, Field } from "../components/Field";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../lib/api";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setBusy(true);
    try {
      await register(email, password, phone);
      navigate("/verify");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-0">
      <Reveal className="lg:border-r lg:border-ink lg:pr-12">
        <p className="label-mono mb-4 text-vermillion">New entry</p>
        <h1 className="font-display text-5xl font-black tracking-tight">
          Join the
          <br />
          <span className="wonky-italic font-medium text-vermillion">index.</span>
        </h1>
        <p className="mt-6 max-w-sm text-ink-soft">
          An account keeps your cart, your addresses, and your order history. Verification
          happens right after — a code is sent to your phone.
        </p>
        <ul className="label-mono mt-8 space-y-2 text-ink-soft">
          <li>◆ Order from the catalogue</li>
          <li>◆ Track shipments</li>
          <li>◆ Upgrade to seller anytime</li>
        </ul>
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
            label="Phone"
            type="tel"
            required
            autoComplete="tel"
            placeholder="+1 555 000 1234"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Field
            label="Password (min. 6 characters)"
            type="password"
            required
            autoComplete="new-password"
            placeholder="••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Field
            label="Confirm password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {error && (
            <p className="border border-vermillion bg-vermillion/10 px-3 py-2 font-mono text-xs text-vermillion">
              ▲ {error}
            </p>
          )}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Creating account…" : "Create account →"}
          </Button>
          <p className="label-mono text-center text-ink-soft">
            Already enrolled?{" "}
            <Link to="/login" className="link-underline text-vermillion">
              Sign in
            </Link>
          </p>
        </form>
      </Reveal>
    </div>
  );
}
