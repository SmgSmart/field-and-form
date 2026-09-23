import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { UserButton } from "@/lib/auth/gates";
import { saveStudio } from "@/lib/studio.functions";
import type { Studio } from "@/lib/studio.types";
import { useAdmin } from "./route";

export const Route = createFileRoute("/admin/")({
  component: IdentityPage,
});

function IdentityPage() {
  const { state, reload } = useAdmin();
  const [form, setForm] = useState<Studio>(state.studio);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setForm(state.studio);
  }, [state.studio]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setSaved(false);
    setError("");
    try {
      const result = await saveStudio({ data: form });
      if (!result.ok) {
        setError(result.error);
        setPending(false);
        return;
      }
      await reload();
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save.");
    } finally {
      setPending(false);
    }
  }

  const live = state.services.filter((service) => service.published).length;

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">The main page</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            This is the name, headline, and contact on the public site. The starter house is Field & Form — replace it with yours. Sample services live under Services until you delete them.
          </p>
        </div>
        <UserButton />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Categories" value={String(state.categories.length)} href="/admin/services" />
        <Stat label="Live services" value={String(live)} href="/admin/services" />
        <Stat label="Inquiries" value={String(state.inquiryCount)} href="/admin/inquiries" />
      </div>

      <form onSubmit={onSubmit} className="mt-8 grid gap-4 rounded-3xl bg-paper p-5 shadow-card sm:grid-cols-2">
        <Field label="Studio name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
        <Field label="Small line" value={form.kicker} onChange={(kicker) => setForm({ ...form, kicker })} />
        <Field
          className="sm:col-span-2"
          label="Headline"
          value={form.headline}
          onChange={(headline) => setForm({ ...form, headline })}
        />
        <label className="space-y-1 text-sm font-medium sm:col-span-2">
          Intro
          <textarea
            value={form.lede}
            onChange={(event) => setForm({ ...form, lede: event.target.value })}
            rows={4}
            className="w-full rounded-xl bg-bone px-3 py-3 text-base font-normal shadow-card outline-none"
          />
        </label>
        <Field label="City" value={form.city} onChange={(city) => setForm({ ...form, city })} />
        <Field label="Phone" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
        <Field
          className="sm:col-span-2"
          label="Email"
          value={form.email}
          onChange={(email) => setForm({ ...form, email })}
        />
        {error ? <p className="text-sm text-copper sm:col-span-2">{error}</p> : null}
        <div className="flex items-center gap-3 sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="h-12 rounded-full bg-copper px-5 text-base font-medium text-bone transition-transform duration-150 ease-out active:scale-[0.96] disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save main page"}
          </button>
          {saved ? <p className="text-sm text-muted">Saved. The public page uses this now.</p> : null}
        </div>
      </form>
    </main>
  );
}

function Stat({ label, value, href }: { label: string; value: string; href: "/admin/services" | "/admin/inquiries" }) {
  return (
    <Link to={href} className="rounded-3xl bg-paper p-4 shadow-card">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl tabular-nums">{value}</p>
    </Link>
  );
}

export function Field({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <label className={`block space-y-1 text-sm font-medium ${className ?? ""}`}>
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl bg-bone px-3 text-base font-normal shadow-card outline-none"
      />
    </label>
  );
}
