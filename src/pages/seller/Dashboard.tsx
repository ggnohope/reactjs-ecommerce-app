import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import Reveal from "../../components/Reveal";
import ProductImage from "../../components/ProductImage";
import { Button, Field, Select, TextArea } from "../../components/Field";
import { errorMessage, SellerAPI } from "../../lib/api";
import { useCategories } from "../../lib/hooks";
import { useToast } from "../../context/ToastContext";
import { money, pad } from "../../lib/format";
import type { Product } from "../../lib/types";

interface ProductForm {
  name: string;
  description: string;
  price: string;
  stock: string;
  category_id: string;
  status: string;
}

const emptyForm: ProductForm = {
  name: "",
  description: "",
  price: "",
  stock: "",
  category_id: "",
  status: "active",
};

export default function SellerDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: categories } = useCategories();

  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["seller-products", page],
    queryFn: () => SellerAPI.products({ page, limit: 10 }),
    placeholderData: (prev) => prev,
  });
  const products = data?.data ?? [];
  const meta = data?.meta;

  // ——— Product create / edit modal ———
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description ?? "",
      price: String(p.price),
      stock: String(p.stock),
      category_id: String(p.category_id),
      status: p.status || "active",
    });
    setModalOpen(true);
  };

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["seller-products"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const saveProduct = useMutation({
    mutationFn: () => {
      if (editing) {
        return SellerAPI.updateProduct(editing.id, {
          name: form.name,
          description: form.description,
          price: Number(form.price),
          stock: Number(form.stock),
          status: form.status,
        });
      }
      return SellerAPI.createProduct({
        name: form.name,
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock),
        category_id: Number(form.category_id),
      });
    },
    onSuccess: () => {
      refresh();
      toast(editing ? "Product updated" : "Product listed");
      setModalOpen(false);
    },
    onError: (err) => toast(errorMessage(err), "err"),
  });

  const deleteProduct = useMutation({
    mutationFn: (id: number) => SellerAPI.deleteProduct(id),
    onSuccess: () => {
      refresh();
      toast("Product removed");
    },
    onError: (err) => toast(errorMessage(err), "err"),
  });

  // ——— Image upload ———
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<number | null>(null);

  const uploadImage = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => SellerAPI.uploadImage(id, file),
    onSuccess: () => {
      refresh();
      toast("Image uploaded");
    },
    onError: (err) => toast(errorMessage(err), "err"),
  });

  const pickImage = (id: number) => {
    setUploadTarget(id);
    fileInput.current?.click();
  };

  const onFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadTarget !== null) {
      uploadImage.mutate({ id: uploadTarget, file });
    }
    e.target.value = "";
  };

  // ——— Category creation ———
  const [catName, setCatName] = useState("");
  const [catParent, setCatParent] = useState("");
  const createCategory = useMutation({
    mutationFn: () =>
      SellerAPI.createCategory({
        name: catName,
        parent_id: catParent ? Number(catParent) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast("Category created");
      setCatName("");
      setCatParent("");
    },
    onError: (err) => toast(errorMessage(err), "err"),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={onFilePicked} />

      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-mono mb-2 text-vermillion">The atelier</p>
          <h1 className="font-display text-5xl font-black tracking-tight">
            Seller's <span className="wonky-italic font-medium">desk.</span>
          </h1>
        </div>
        <Button onClick={openCreate}>+ List a product</Button>
      </Reveal>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_300px]">
        {/* ——— Product table ——— */}
        <Reveal delay={0.08}>
          <section className="border border-ink">
            <header className="rule-b flex items-center justify-between px-5 py-4">
              <h2 className="font-display text-xl font-bold">Your catalogue</h2>
              <span className="label-mono text-ink-soft">
                {meta ? `${meta.total} item${meta.total === 1 ? "" : "s"}` : ""}
              </span>
            </header>

            {isLoading ? (
              <p className="label-mono animate-pulse p-5">Loading…</p>
            ) : products.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <p className="wonky-italic text-2xl">Nothing listed yet.</p>
                <p className="mt-2 text-sm text-ink-soft">
                  List your first product — it appears in the catalogue immediately.
                </p>
              </div>
            ) : (
              <ul>
                {products.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center gap-4 border-b border-rule px-5 py-4 last:border-b-0"
                  >
                    <div className="h-16 w-[52px] shrink-0 overflow-hidden border border-ink">
                      <ProductImage product={p} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display font-semibold">
                        <span className="label-mono mr-2 text-ink-soft">№ {pad(p.id)}</span>
                        {p.name}
                      </p>
                      <p className="label-mono mt-0.5 text-ink-soft">
                        {p.category?.name ?? `cat ${p.category_id}`} · stock {p.stock} ·{" "}
                        <span className={p.status === "active" ? "text-moss" : "text-vermillion"}>
                          {p.status}
                        </span>
                      </p>
                    </div>
                    <p className="font-mono text-sm">{money(p.price)}</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => pickImage(p.id)}
                        disabled={uploadImage.isPending && uploadTarget === p.id}
                        className="label-mono cursor-pointer text-ink-soft hover:text-vermillion disabled:opacity-50"
                      >
                        {uploadImage.isPending && uploadTarget === p.id ? "Uploading…" : "Image"}
                      </button>
                      <button
                        onClick={() => openEdit(p)}
                        className="label-mono cursor-pointer text-ink-soft hover:text-vermillion"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete “${p.name}” from the catalogue?`)) {
                            deleteProduct.mutate(p.id);
                          }
                        }}
                        className="label-mono cursor-pointer text-ink-soft hover:text-vermillion"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {meta && meta.pages > 1 && (
              <footer className="rule-t flex items-center justify-between px-5 py-3">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="label-mono cursor-pointer disabled:opacity-30"
                >
                  ← Prev
                </button>
                <span className="label-mono text-ink-soft">
                  {meta.page} / {meta.pages}
                </span>
                <button
                  disabled={page >= meta.pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="label-mono cursor-pointer disabled:opacity-30"
                >
                  Next →
                </button>
              </footer>
            )}
          </section>
        </Reveal>

        {/* ——— Category panel ——— */}
        <Reveal delay={0.16}>
          <section className="border border-ink bg-paper-deep p-5">
            <h2 className="font-display text-xl font-bold">Departments</h2>
            <p className="mt-1 text-xs text-ink-soft">
              Categories are shared across the store.
            </p>
            <ul className="mt-4 max-h-44 space-y-1 overflow-y-auto">
              {(categories ?? []).map((c) => (
                <li key={c.id} className="label-mono text-ink-soft">
                  {pad(c.id, 2)} · {c.name}
                </li>
              ))}
              {(categories ?? []).length === 0 && (
                <li className="label-mono text-ink-soft">None yet — create the first.</li>
              )}
            </ul>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createCategory.mutate();
              }}
              className="rule-t mt-4 space-y-3 pt-4"
            >
              <Field
                label="New department"
                required
                placeholder="e.g. Lighting"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
              />
              <Select label="Parent (optional)" value={catParent} onChange={(e) => setCatParent(e.target.value)}>
                <option value="">— none —</option>
                {(categories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <Button type="submit" disabled={createCategory.isPending || !catName} className="w-full">
                {createCategory.isPending ? "Creating…" : "Create department"}
              </Button>
            </form>
          </section>
        </Reveal>
      </div>

      {/* ——— Create / edit modal ——— */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="fixed inset-0 z-[60] bg-ink/50 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ opacity: 0, y: 32, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 360, damping: 32 }}
              className="fixed left-1/2 top-1/2 z-[70] max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-ink bg-paper shadow-block"
            >
              <header className="rule-b flex items-center justify-between px-5 py-4">
                <h2 className="font-display text-xl font-bold">
                  {editing ? `Edit № ${pad(editing.id)}` : "List a product"}
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="label-mono cursor-pointer hover:text-vermillion"
                >
                  Close ✕
                </button>
              </header>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  saveProduct.mutate();
                }}
                className="space-y-4 p-5"
              >
                <Field
                  label="Name"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <TextArea
                  label="Description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="Price ($)"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                  <Field
                    label="Stock"
                    type="number"
                    min="0"
                    required
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  />
                </div>
                {!editing && (
                  <Select
                    label="Department"
                    required
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  >
                    <option value="">— choose —</option>
                    {(categories ?? []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                )}
                {editing && (
                  <Select
                    label="Status"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </Select>
                )}
                <Button type="submit" disabled={saveProduct.isPending} className="w-full">
                  {saveProduct.isPending ? "Saving…" : editing ? "Save changes" : "List product"}
                </Button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
