import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ServiceFace, ServiceMark } from "@/components/service-face";
import { deleteCategory, deleteService, saveCategory, saveService } from "@/lib/studio.functions";
import { FACES, ACTION_KINDS, type ActionKind, type Service, type ServiceDraft } from "@/lib/studio.types";
import { cn } from "@/lib/cn";
import { useAdmin } from "./-desk-context";

export const Route = createFileRoute("/admin/services")({
  component: CatalogPage,
});

const emptyDraft = (categoryId: string): ServiceDraft => ({
  categoryId,
  name: "",
  summary: "",
  story: "",
  priceLabel: "",
  durationLabel: "",
  featured: false,
  published: true,
  face: "arc",
  actions: [{ label: "Request this", kind: "inquire" }],
  images: [],
});

type Photo = { key: string; id?: string; dataUrl?: string; preview: string };

function photosFrom(service: Service): Photo[] {
  return service.imageIds.map((id) => ({ key: id, id, preview: `/api/media/${id}` }));
}

function CatalogPage() {
  const { state, reload } = useAdmin();
  const [categoryName, setCategoryName] = useState("");
  const [categoryBlurb, setCategoryBlurb] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [draft, setDraft] = useState<ServiceDraft>(emptyDraft(state.categories[0]?.id ?? ""));
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [serviceError, setServiceError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirming, setConfirming] = useState<{ kind: "category" | "service"; id: string } | null>(null);
  const { pending, run } = useWait();

  async function addCategory(event: FormEvent) {
    event.preventDefault();
    setCategoryError("");
    await run(async () => {
      const result = await saveCategory({ data: { name: categoryName, blurb: categoryBlurb } });
      if (!result.ok) {
        setCategoryError(result.error);
        return;
      }
      setCategoryName("");
      setCategoryBlurb("");
      setNotice(`Added ${result.data.name}.`);
      if (!draft.categoryId) setDraft((current) => ({ ...current, categoryId: result.data.id }));
      await reload();
    });
  }

  async function removeCategory(id: string, name: string) {
    setCategoryError("");
    setConfirming(null);
    await run(async () => {
      try {
        const result = await deleteCategory({ data: id });
        if (!result.ok) {
          setCategoryError(result.error);
          return;
        }
        if (draft.categoryId === id) {
          const next = state.categories.find((category) => category.id !== id);
          setDraft((current) => ({ ...current, categoryId: next?.id ?? "" }));
        }
        setNotice(`Deleted ${name}.`);
        await reload();
      } catch (cause) {
        setCategoryError(cause instanceof Error ? cause.message : "Could not delete that category.");
      }
    });
  }

  function editService(service: Service) {
    setDraft({
      id: service.id,
      categoryId: service.categoryId,
      name: service.name,
      summary: service.summary,
      story: service.story,
      priceLabel: service.priceLabel,
      durationLabel: service.durationLabel,
      featured: service.featured,
      published: service.published,
      face: service.face,
      actions: service.actions.map((action) => ({ label: action.label, kind: action.kind })),
      images: [],
    });
    setPhotos(photosFrom(service));
    setServiceError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetDraft() {
    setDraft(emptyDraft(draft.categoryId || state.categories[0]?.id || ""));
    setPhotos([]);
  }

  async function addPhotos(files: File[]) {
    const room = 3 - photos.length;
    if (room <= 0 || files.length === 0) return;
    setServiceError("");
    const chosen = files.slice(0, room);
    const added: Photo[] = [];
    for (const file of chosen) {
      try {
        const dataUrl = await compressImage(file);
        added.push({ key: crypto.randomUUID(), dataUrl, preview: dataUrl });
      } catch (cause) {
        setServiceError(cause instanceof Error ? cause.message : "Could not read that photo.");
      }
    }
    setPhotos((current) => [...current, ...added].slice(0, 3));
    if (files.length > room) setNotice("Three photos is the maximum. Extra ones were left out.");
  }

  async function onSaveService(event: FormEvent) {
    event.preventDefault();
    setServiceError("");
    await run(async () => {
      try {
        const result = await saveService({
          data: {
            ...draft,
            images: photos.map((photo) => ({ id: photo.id, dataUrl: photo.dataUrl })),
          },
        });
        if (!result.ok) {
          setServiceError(result.error);
          return;
        }
        setNotice(draft.id ? `Updated ${result.data.name}.` : `Added ${result.data.name} to the site.`);
        setDraft(emptyDraft(draft.categoryId));
        setPhotos([]);
        await reload();
      } catch (cause) {
        setServiceError(cause instanceof Error ? cause.message : "Could not save the service.");
      }
    });
  }

  async function removeService(service: Service) {
    setServiceError("");
    setConfirming(null);
    await run(async () => {
      try {
        const result = await deleteService({ data: service.id });
        if (!result.ok) {
          setServiceError(result.error);
          return;
        }
        if (draft.id === service.id) {
          setDraft(emptyDraft(state.categories[0]?.id ?? ""));
          setPhotos([]);
        }
        setNotice(`Deleted ${service.name}.`);
        await reload();
      } catch (cause) {
        setServiceError(cause instanceof Error ? cause.message : "Could not delete that service.");
      }
    });
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <h1 className="font-display text-4xl">Services</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
        Categories group the public list. A service only appears on the site when it is published. Featured ones also sit on the main page.
      </p>

      <section className="mt-8">
        <h2 className="font-display text-2xl">Categories</h2>
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {state.categories.map((category) => {
            const asking = confirming?.kind === "category" && confirming.id === category.id;
            const count = state.services.filter((service) => service.categoryId === category.id).length;
            return (
              <li key={category.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{category.name}</p>
                  {asking ? (
                    <p className="text-sm text-copper">
                      {count
                        ? `Delete ${category.name} and its ${count} service${count === 1 ? "" : "s"}?`
                        : `Delete ${category.name}?`}
                    </p>
                  ) : (
                    <p className="truncate text-sm text-muted">{category.blurb}</p>
                  )}
                </div>
                {asking ? (
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => removeCategory(category.id, category.name)}
                      className="h-11 rounded-full bg-copper px-3 text-sm font-medium text-bone disabled:opacity-60"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => setConfirming(null)}
                      className="h-11 px-3 text-sm"
                    >
                      Keep
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirming({ kind: "category", id: category.id })}
                    className="h-11 shrink-0 px-2 text-sm text-copper"
                  >
                    Delete
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        <form onSubmit={addCategory} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1.4fr_auto]">
          <Field label="New category" value={categoryName} onChange={setCategoryName} />
          <Field label="Line under it" value={categoryBlurb} onChange={setCategoryBlurb} />
          <button
            type="submit"
            disabled={pending}
            className="h-12 self-end rounded-full bg-ink px-4 text-sm font-medium text-bone disabled:opacity-60"
          >
            Add
          </button>
        </form>
        {categoryError ? <p className="mt-2 text-sm text-copper">{categoryError}</p> : null}
      </section>

      <section className="mt-10">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl">{draft.id ? "Edit service" : "New service"}</h2>
          {draft.id ? (
            <button
              type="button"
              className="text-sm text-muted"
              onClick={resetDraft}
            >
              Start a new one
            </button>
          ) : null}
        </div>
        <form onSubmit={onSaveService} className="mt-4 grid gap-4 rounded-3xl bg-paper p-5 shadow-card">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" value={draft.name} onChange={(name) => setDraft({ ...draft, name })} />
            <label className="block space-y-1 text-sm font-medium">
              Category
              <select
                value={draft.categoryId}
                onChange={(event) => setDraft({ ...draft, categoryId: event.target.value })}
                className="h-12 w-full rounded-xl bg-bone px-3 text-base font-normal shadow-card outline-none"
              >
                {state.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block space-y-1 text-sm font-medium">
            Summary
            <textarea
              value={draft.summary}
              onChange={(event) => setDraft({ ...draft, summary: event.target.value })}
              rows={2}
              className="w-full rounded-xl bg-bone px-3 py-3 text-base font-normal shadow-card outline-none"
            />
          </label>
          <div
            className="rounded-2xl bg-bone p-4"
            onPaste={(event) => {
              const files = [...event.clipboardData.files].filter((file) => file.type.startsWith("image/"));
              if (files.length === 0) return;
              event.preventDefault();
              void addPhotos(files);
            }}
          >
            <p className="text-sm font-medium">Photos</p>
            <p className="mt-1 text-sm text-muted">
              Add one, two, or three. The first is the lead photo on the cards and the service page.
            </p>
            {photos.length > 0 ? (
              <ul className="mt-3 grid grid-cols-3 gap-3">
                {photos.map((photo, index) => (
                  <li key={photo.key} className="min-w-0">
                    <img src={photo.preview} alt="" className="h-24 w-full rounded-2xl bg-field object-cover sm:h-28" />
                    <div className="mt-1 flex flex-col">
                      {index === 0 ? (
                        <span className="flex h-11 items-center text-sm text-copper">Lead</span>
                      ) : (
                        <button
                          type="button"
                          className="h-11 text-left text-sm font-medium"
                          onClick={() =>
                            setPhotos((current) => {
                              const next = current.slice();
                              const [item] = next.splice(index, 1);
                              next.unshift(item);
                              return next;
                            })
                          }
                        >
                          Make lead
                        </button>
                      )}
                      <button
                        type="button"
                        className="h-11 text-left text-sm text-copper"
                        onClick={() => setPhotos((current) => current.filter((item) => item.key !== photo.key))}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
            {photos.length >= 3 ? (
              <p className="mt-3 text-sm font-medium">Three photos added</p>
            ) : (
              <label className="relative mt-3 inline-flex h-12 cursor-pointer items-center overflow-hidden rounded-full bg-ink px-5 text-sm font-medium text-bone">
                <span>{photos.length === 0 ? "Add a photo" : "Add another photo"}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={pending}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  onChange={(event) => {
                    const files = [...(event.target.files ?? [])];
                    event.target.value = "";
                    void addPhotos(files);
                  }}
                />
              </label>
            )}
          </div>
          <label className="block space-y-1 text-sm font-medium">
            The longer note on the service page
            <textarea
              value={draft.story}
              onChange={(event) => setDraft({ ...draft, story: event.target.value })}
              rows={4}
              className="w-full rounded-xl bg-bone px-3 py-3 text-base font-normal shadow-card outline-none"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Price line"
              value={draft.priceLabel}
              onChange={(priceLabel) => setDraft({ ...draft, priceLabel })}
            />
            <Field
              label="Time line"
              value={draft.durationLabel}
              onChange={(durationLabel) => setDraft({ ...draft, durationLabel })}
            />
          </div>
          <fieldset>
            <legend className="text-sm font-medium">Face</legend>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {FACES.map((face) => (
                <button
                  key={face}
                  type="button"
                  onClick={() => setDraft({ ...draft, face })}
                  className={cn(
                    "rounded-2xl p-1",
                    draft.face === face ? "ring-2 ring-copper" : "ring-1 ring-line",
                  )}
                  aria-pressed={draft.face === face}
                >
                  <ServiceFace face={face} className="h-16 rounded-xl" />
                  <span className="sr-only">{face}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-wrap gap-4">
            <Check
              label="Published on the site"
              checked={draft.published}
              onChange={(published) => setDraft({ ...draft, published })}
            />
            <Check
              label="Show on the main page"
              checked={draft.featured}
              onChange={(featured) => setDraft({ ...draft, featured })}
            />
          </div>
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Actions on the service page</legend>
            {draft.actions.map((action, index) => (
              <div key={index} className="grid gap-2 sm:grid-cols-[1fr_10rem_auto]">
                <input
                  value={action.label}
                  onChange={(event) => {
                    const actions = draft.actions.slice();
                    actions[index] = { ...action, label: event.target.value };
                    setDraft({ ...draft, actions });
                  }}
                  aria-label={`Action ${index + 1} label`}
                  className="h-12 rounded-xl bg-bone px-3 text-base shadow-card outline-none"
                />
                <select
                  value={action.kind}
                  onChange={(event) => {
                    const actions = draft.actions.slice();
                    actions[index] = { ...action, kind: event.target.value as ActionKind };
                    setDraft({ ...draft, actions });
                  }}
                  aria-label={`Action ${index + 1} kind`}
                  className="h-12 rounded-xl bg-bone px-3 text-base shadow-card outline-none"
                >
                  {ACTION_KINDS.map((kind) => (
                    <option key={kind} value={kind}>
                      {kind === "inquire" ? "Request form" : kind === "quote" ? "Quote form" : "Call"}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="h-12 px-2 text-sm text-copper disabled:opacity-40"
                  disabled={draft.actions.length === 1}
                  onClick={() =>
                    setDraft({ ...draft, actions: draft.actions.filter((_, item) => item !== index) })
                  }
                >
                  Remove
                </button>
              </div>
            ))}
            {draft.actions.length < 3 ? (
              <button
                type="button"
                className="h-11 text-sm font-medium text-ink"
                onClick={() =>
                  setDraft({
                    ...draft,
                    actions: [...draft.actions, { label: "Ask for a quote", kind: "quote" }],
                  })
                }
              >
                Add an action
              </button>
            ) : null}
          </fieldset>
          {serviceError ? <p className="text-sm text-copper">{serviceError}</p> : null}
          {notice ? <p className="text-sm text-muted">{notice}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="h-12 rounded-full bg-copper px-5 text-base font-medium text-bone disabled:opacity-60"
          >
            {pending ? "Saving…" : draft.id ? "Update service" : "Add to the site"}
          </button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl">Listed</h2>
        {serviceError ? <p className="mt-2 text-sm text-copper">{serviceError}</p> : null}
        <ul className="mt-4 space-y-3">
          {state.services.map((service) => {
            const asking = confirming?.kind === "service" && confirming.id === service.id;
            return (
              <li key={service.id} className="flex items-center gap-3 rounded-3xl bg-paper p-2 shadow-card">
                <ServiceMark
                  face={service.face}
                  imageId={service.imageIds[0]}
                  className="size-16 shrink-0 rounded-2xl"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{service.name}</p>
                  <p className="truncate text-sm text-muted">
                    {asking
                      ? `Delete ${service.name}?`
                      : `${service.categoryName}${service.published ? "" : " · hidden"}${service.featured ? " · on main page" : ""}${service.imageIds.length ? ` · ${service.imageIds.length} photo${service.imageIds.length === 1 ? "" : "s"}` : ""}`}
                  </p>
                </div>
                {asking ? (
                  <div className="flex shrink-0 flex-col">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => removeService(service)}
                      className="h-11 rounded-full bg-copper px-3 text-sm font-medium text-bone disabled:opacity-60"
                    >
                      Delete
                    </button>
                    <button type="button" disabled={pending} onClick={() => setConfirming(null)} className="h-11 px-3 text-sm">
                      Keep
                    </button>
                  </div>
                ) : (
                  <div className="flex shrink-0 flex-col">
                    <button type="button" onClick={() => editService(service)} className="h-11 px-2 text-sm font-medium">
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirming({ kind: "service", id: service.id })}
                      className="h-11 px-2 text-sm text-copper"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that photo."));
    reader.onload = () => {
      const source = new Image();
      source.onload = () => {
        const max = 1400;
        const scale = Math.min(1, max / Math.max(source.width, source.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(source.width * scale));
        canvas.height = Math.max(1, Math.round(source.height * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Could not read that photo."));
          return;
        }
        context.drawImage(source, 0, 0, canvas.width, canvas.height);
        let quality = 0.72;
        let url = canvas.toDataURL("image/jpeg", quality);
        while (url.length > 500_000 && quality > 0.45) {
          quality -= 0.08;
          url = canvas.toDataURL("image/jpeg", quality);
        }
        if (url.length > 700_000) {
          reject(new Error("That photo is too large. Try a smaller one."));
          return;
        }
        resolve(url);
      };
      source.onerror = () => reject(new Error("Use a JPEG, PNG, or WebP photo."));
      source.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 items-center gap-2 text-sm font-medium">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-5 accent-copper"
      />
      {label}
    </label>
  );
}

function useWait() {
  const [pending, setPending] = useState(false);
  async function run(task: () => Promise<void>) {
    setPending(true);
    try {
      await task();
    } finally {
      setPending(false);
    }
  }
  return { pending, run };
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-1 text-sm font-medium">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl bg-bone px-3 text-base font-normal shadow-card outline-none"
      />
    </label>
  );
}
