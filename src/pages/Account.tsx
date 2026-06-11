import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Reveal from "../components/Reveal";
import { Button, Field } from "../components/Field";
import { useAuth } from "../context/AuthContext";
import { useAddresses } from "../lib/hooks";
import { AddressAPI, AuthAPI, errorMessage } from "../lib/api";
import { useToast } from "../context/ToastContext";
import type { Address } from "../lib/types";

const emptyAddress = {
  street: "",
  city: "",
  state: "",
  postal_code: "",
  country: "",
  is_default: false,
};

export default function Account() {
  const { user, isSeller, refreshUser, logoutAll } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ——— Profile ———
  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");

  useEffect(() => {
    setFirstName(user?.first_name ?? "");
    setLastName(user?.last_name ?? "");
  }, [user]);

  const saveProfile = useMutation({
    mutationFn: () => AuthAPI.updateProfile({ first_name: firstName, last_name: lastName }),
    onSuccess: async () => {
      await refreshUser();
      toast("Profile updated");
    },
    onError: (err) => toast(errorMessage(err), "err"),
  });

  // ——— Become seller ———
  const becomeSeller = useMutation({
    mutationFn: () => AuthAPI.becomeSeller(),
    onSuccess: async () => {
      await refreshUser();
      toast("Welcome to the atelier — you are now a seller");
      navigate("/seller");
    },
    onError: (err) => toast(errorMessage(err), "err"),
  });

  // ——— Addresses ———
  const { data: addresses, isLoading: addressesLoading } = useAddresses();
  const [editing, setEditing] = useState<Address | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyAddress);

  const startEdit = (a: Address) => {
    setEditing(a);
    setForm({
      street: a.street,
      city: a.city,
      state: a.state,
      postal_code: a.postal_code,
      country: a.country,
      is_default: a.is_default,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditing(null);
    setForm(emptyAddress);
    setShowForm(false);
  };

  const saveAddress = useMutation({
    mutationFn: () => (editing ? AddressAPI.update(editing.id, form) : AddressAPI.create(form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast(editing ? "Address updated" : "Address added");
      resetForm();
    },
    onError: (err) => toast(errorMessage(err), "err"),
  });

  const deleteAddress = useMutation({
    mutationFn: (id: number) => AddressAPI.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast("Address removed");
    },
    onError: (err) => toast(errorMessage(err), "err"),
  });

  const handleLogoutAll = async () => {
    await logoutAll();
    toast("Signed out everywhere");
    navigate("/");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Reveal>
        <p className="label-mono mb-2 text-ink-soft">The desk</p>
        <h1 className="font-display text-5xl font-black tracking-tight">
          Your <span className="wonky-italic font-medium text-vermillion">account.</span>
        </h1>
        <p className="label-mono mt-4 text-ink-soft">
          {user?.email} · {isSeller ? "Seller" : "Buyer"} ·{" "}
          {user?.verified ? (
            <span className="text-moss">verified ✓</span>
          ) : (
            <Link to="/verify" className="link-underline text-vermillion">
              unverified — verify now
            </Link>
          )}
        </p>
      </Reveal>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        {/* ——— Profile ——— */}
        <Reveal delay={0.08}>
          <section className="border border-ink">
            <header className="rule-b px-5 py-4">
              <h2 className="font-display text-xl font-bold">Profile</h2>
            </header>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveProfile.mutate();
              }}
              className="space-y-4 p-5"
            >
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <Field
                  label="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <Field label="Email" value={user?.email ?? ""} disabled className="opacity-60" />
              <Field label="Phone" value={user?.phone ?? ""} disabled className="opacity-60" />
              <Button type="submit" disabled={saveProfile.isPending}>
                {saveProfile.isPending ? "Saving…" : "Save profile"}
              </Button>
            </form>
          </section>

          {/* ——— Seller upgrade ——— */}
          <section className="mt-8 border border-ink bg-paper-deep p-5">
            <h2 className="font-display text-xl font-bold">
              {isSeller ? "Your atelier" : "Open an atelier"}
            </h2>
            {isSeller ? (
              <>
                <p className="mt-2 text-sm text-ink-soft">
                  You are registered as a seller. Manage your catalogue from the atelier.
                </p>
                <Link to="/seller" className="mt-4 inline-block">
                  <Button>To the atelier →</Button>
                </Link>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm text-ink-soft">
                  Upgrade your account to list goods in the catalogue. Instant, free, reversible
                  by no one.
                </p>
                <Button
                  className="mt-4"
                  onClick={() => becomeSeller.mutate()}
                  disabled={becomeSeller.isPending}
                >
                  {becomeSeller.isPending ? "Upgrading…" : "Become a seller"}
                </Button>
              </>
            )}
          </section>

          {/* ——— Sessions ——— */}
          <section className="mt-8 border border-vermillion/60 p-5">
            <h2 className="font-display text-xl font-bold">Sessions</h2>
            <p className="mt-2 text-sm text-ink-soft">
              Sign out of every device, including this one.
            </p>
            <Button variant="danger" className="mt-4" onClick={handleLogoutAll}>
              Sign out everywhere
            </Button>
          </section>
        </Reveal>

        {/* ——— Addresses ——— */}
        <Reveal delay={0.16}>
          <section className="border border-ink">
            <header className="rule-b flex items-center justify-between px-5 py-4">
              <h2 className="font-display text-xl font-bold">Addresses</h2>
              {!showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="label-mono cursor-pointer text-vermillion hover:underline"
                >
                  + Add
                </button>
              )}
            </header>
            <div className="p-5">
              {addressesLoading ? (
                <p className="label-mono animate-pulse">Loading…</p>
              ) : (addresses ?? []).length === 0 && !showForm ? (
                <p className="wonky-italic text-xl text-ink-soft">No addresses on file.</p>
              ) : (
                <ul className="space-y-3">
                  {(addresses ?? []).map((a) => (
                    <li key={a.id} className="border border-rule p-4">
                      <p className="text-sm">
                        {[a.street, a.city, a.state, a.postal_code, a.country]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      <div className="mt-2 flex items-center gap-4">
                        {a.is_default && (
                          <span className="label-mono bg-ink px-1.5 py-0.5 text-paper">Default</span>
                        )}
                        <button
                          onClick={() => startEdit(a)}
                          className="label-mono cursor-pointer text-ink-soft hover:text-vermillion"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteAddress.mutate(a.id)}
                          disabled={deleteAddress.isPending}
                          className="label-mono cursor-pointer text-ink-soft hover:text-vermillion"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {showForm && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveAddress.mutate();
                  }}
                  className={`space-y-4 ${(addresses ?? []).length > 0 ? "rule-t mt-5 pt-5" : ""}`}
                >
                  <p className="label-mono text-ink-soft">
                    {editing ? `Editing address #${editing.id}` : "New address"}
                  </p>
                  <Field
                    label="Street"
                    required
                    value={form.street}
                    onChange={(e) => setForm({ ...form, street: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Field
                      label="City"
                      required
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                    />
                    <Field
                      label="State / Province"
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                    />
                    <Field
                      label="Postal code"
                      required
                      value={form.postal_code}
                      onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                    />
                    <Field
                      label="Country"
                      required
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value })}
                    />
                  </div>
                  <label className="label-mono flex cursor-pointer items-center gap-2 text-ink-soft">
                    <input
                      type="checkbox"
                      checked={form.is_default}
                      onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                      className="accent-[#C03B12]"
                    />
                    Set as default
                  </label>
                  <div className="flex gap-3">
                    <Button type="submit" disabled={saveAddress.isPending}>
                      {saveAddress.isPending ? "Saving…" : editing ? "Update address" : "Add address"}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  );
}
