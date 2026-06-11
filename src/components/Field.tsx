import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const base =
  "w-full border border-ink bg-paper px-3 py-2.5 text-sm text-ink outline-none transition-shadow placeholder:text-ink-soft/50 focus:shadow-block-sm";

export function Field({
  label,
  ...props
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="label-mono mb-1.5 block text-ink-soft">{label}</span>
      <input {...props} className={`${base} ${props.className ?? ""}`} />
    </label>
  );
}

export function TextArea({
  label,
  ...props
}: { label: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      <span className="label-mono mb-1.5 block text-ink-soft">{label}</span>
      <textarea {...props} className={`${base} min-h-24 resize-y ${props.className ?? ""}`} />
    </label>
  );
}

export function Select({
  label,
  ...props
}: { label: string } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block">
      <span className="label-mono mb-1.5 block text-ink-soft">{label}</span>
      <select {...props} className={`${base} cursor-pointer ${props.className ?? ""}`} />
    </label>
  );
}

export function Button({
  children,
  variant = "primary",
  ...props
}: {
  children: React.ReactNode;
  variant?: "primary" | "outline" | "danger";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles = {
    primary: "bg-ink text-paper hover:bg-vermillion",
    outline: "border border-ink bg-transparent text-ink hover:bg-ink hover:text-paper",
    danger: "bg-vermillion text-paper hover:bg-ink",
  }[variant];
  return (
    <button
      {...props}
      className={`label-mono cursor-pointer px-5 py-3 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}
