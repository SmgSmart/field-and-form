import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { saveTheme } from "@/lib/studio.functions";
import { applyTheme, LOOKS, LOOK_NOTES, THEMES, tuneTheme, type Look, type ThemeTokens } from "@/lib/theme";
import { cn } from "@/lib/cn";
import { useAdmin } from "./-desk-context";

export const Route = createFileRoute("/admin/theme")({
  component: ThemePage,
});

function ThemePage() {
  const { state, reload } = useAdmin();
  const router = useRouter();
  const [draft, setDraft] = useState<ThemeTokens>(state.theme);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setDraft(state.theme);
  }, [state.theme]);

  useEffect(() => {
    applyTheme(draft);
  }, [draft]);

  useEffect(() => {
    return () => applyTheme(state.theme);
  }, [state.theme]);

  function choosePalette(theme: ThemeTokens) {
    setSaved(false);
    setDraft(theme);
  }

  function chooseLook(look: Look) {
    setSaved(false);
    setDraft((current) => ({ ...current, look }));
  }

  function setColor(key: "bone" | "paper" | "ink" | "copper" | "field", value: string) {
    setSaved(false);
    setDraft((current) => tuneTheme(current, key, value));
  }

  async function onSave() {
    setPending(true);
    setSaved(false);
    setError("");
    try {
      const result = await saveTheme({ data: draft });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      await reload();
      await router.invalidate();
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save the appearance.");
    } finally {
      setPending(false);
    }
  }

  const paletteId = THEMES.find(
    (theme) =>
      theme.bone === draft.bone &&
      theme.paper === draft.paper &&
      theme.ink === draft.ink &&
      theme.copper === draft.copper &&
      theme.field === draft.field,
  )?.id;

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <h1 className="font-display text-4xl">Appearance</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
        Pick a palette, then a surface. This desk changes as you tap, so you can see it. The public site updates when you save.
      </p>

      <section className="mt-8">
        <h2 className="font-display text-2xl">Palettes</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {THEMES.map((theme) => {
            const selected = paletteId === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => choosePalette(theme)}
                aria-pressed={selected}
                className={cn(
                  "rounded-3xl bg-paper p-2 text-left shadow-card",
                  selected && "ring-2 ring-copper",
                )}
              >
                <span className="flex h-16 overflow-hidden rounded-2xl">
                  <span className="flex-1" style={{ background: theme.bone }} />
                  <span className="flex-1" style={{ background: theme.copper }} />
                  <span className="flex-1" style={{ background: theme.ink }} />
                  <span className="flex-1" style={{ background: theme.field }} />
                </span>
                <span className="mt-2 block px-1 pb-1 text-sm font-medium">{theme.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-2xl">Surface</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {LOOKS.map((look) => {
            const selected = draft.look === look;
            const note = LOOK_NOTES[look];
            return (
              <button
                key={look}
                type="button"
                onClick={() => chooseLook(look)}
                aria-pressed={selected}
                className={cn(
                  "rounded-3xl bg-paper p-4 text-left shadow-card",
                  selected && "ring-2 ring-copper",
                )}
              >
                <SurfaceMark look={look} />
                <span className="mt-3 block font-medium">{note.name}</span>
                <span className="mt-1 block text-sm leading-relaxed text-muted">{note.note}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-2xl">Your colours</h2>
        <p className="mt-2 text-sm text-muted">Move any of these and the palette becomes your own.</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <ColorField label="Canvas" value={draft.bone} onChange={(value) => setColor("bone", value)} />
          <ColorField label="Cards" value={draft.paper} onChange={(value) => setColor("paper", value)} />
          <ColorField label="Ink" value={draft.ink} onChange={(value) => setColor("ink", value)} />
          <ColorField label="Accent" value={draft.copper} onChange={(value) => setColor("copper", value)} />
          <ColorField label="Footer" value={draft.field} onChange={(value) => setColor("field", value)} />
        </div>
      </section>

      {error ? <p className="mt-4 text-sm text-copper">{error}</p> : null}
      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => void onSave()}
          className="h-12 rounded-full bg-copper px-5 text-base font-medium text-bone disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save appearance"}
        </button>
        {saved ? <p className="text-sm text-muted">Saved. The public site uses this now.</p> : null}
      </div>
    </main>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl bg-paper p-3 shadow-card">
      <input
        type="color"
        value={value}
        aria-label={label}
        onChange={(event) => onChange(event.target.value)}
        className="size-11 shrink-0 cursor-pointer rounded-full border border-line bg-transparent"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs uppercase tracking-wide text-muted">{value}</span>
      </span>
    </label>
  );
}

function SurfaceMark({ look }: { look: Look }) {
  if (look === "classic") {
    return (
      <span className="block border border-line bg-bone p-3">
        <span className="block h-2 w-16 bg-ink" />
        <span className="mt-2 block h-2 w-10 bg-copper" />
      </span>
    );
  }
  if (look === "glass") {
    return (
      <span className="block rounded-2xl border border-line bg-bone/70 p-3 backdrop-blur">
        <span className="block h-8 rounded-xl bg-copper/40" />
      </span>
    );
  }
  if (look === "bold") {
    return (
      <span className="block border-2 border-ink bg-paper p-3 shadow-[4px_4px_0_0_var(--color-ink)]">
        <span className="block h-3 w-14 bg-ink" />
        <span className="mt-2 block h-3 w-8 bg-copper" />
      </span>
    );
  }
  return (
    <span className="block rounded-2xl bg-bone p-3 shadow-card">
      <span className="block h-8 rounded-xl bg-field" />
    </span>
  );
}
