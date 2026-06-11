import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Reveal from "../components/Reveal";
import { Button, Field } from "../components/Field";
import { AuthAPI, errorMessage } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Verify() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [codeRequested, setCodeRequested] = useState(false);

  if (user?.verified) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <Reveal>
          <p className="font-display text-6xl">✓</p>
          <h1 className="mt-4 font-display text-4xl font-black">Already verified.</h1>
          <p className="mt-3 text-ink-soft">Your account is in good standing.</p>
          <Link to="/shop" className="label-mono link-underline mt-8 inline-block text-vermillion">
            → To the catalogue
          </Link>
        </Reveal>
      </div>
    );
  }

  const requestCode = async () => {
    setError("");
    setRequesting(true);
    try {
      await AuthAPI.requestVerifyCode();
      setCodeRequested(true);
      toast("Verification code sent to your phone");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setRequesting(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await AuthAPI.verify(code);
      await refreshUser();
      toast("Account verified");
      navigate("/account");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <Reveal>
        <p className="label-mono mb-4 text-vermillion">One more step</p>
        <h1 className="font-display text-5xl font-black tracking-tight">
          Verify your <span className="wonky-italic font-medium">standing.</span>
        </h1>
        <p className="mt-5 text-ink-soft">
          Request a code — it will be sent to the phone number on file
          {user?.phone ? ` (${user.phone})` : ""} — then enter it below.
        </p>
      </Reveal>

      <Reveal delay={0.12} className="mt-10 space-y-6 border border-ink p-6 shadow-block">
        <div className="flex items-center justify-between gap-4">
          <p className="label-mono text-ink-soft">
            {codeRequested ? "Code sent. Didn't arrive?" : "Step 1 — request your code"}
          </p>
          <Button variant="outline" onClick={requestCode} disabled={requesting}>
            {requesting ? "Sending…" : codeRequested ? "Resend" : "Send code"}
          </Button>
        </div>

        <form onSubmit={submit} className="rule-t space-y-5 pt-6">
          <Field
            label="Step 2 — enter the 6-digit code"
            placeholder="123456"
            required
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="font-mono text-xl tracking-[0.4em]"
          />
          {error && (
            <p className="border border-vermillion bg-vermillion/10 px-3 py-2 font-mono text-xs text-vermillion">
              ▲ {error}
            </p>
          )}
          <Button type="submit" disabled={busy || !code} className="w-full">
            {busy ? "Verifying…" : "Verify account →"}
          </Button>
        </form>

        <p className="label-mono text-center text-ink-soft">
          You can{" "}
          <Link to="/shop" className="link-underline text-vermillion">
            skip for now
          </Link>{" "}
          and verify later from your account.
        </p>
      </Reveal>
    </div>
  );
}
