import { useEffect, useId, useRef, useState } from "react";
import { submitInquiry } from "@/lib/studio.functions";
import type { ServiceAction } from "@/lib/studio.types";

export function InquiryDialog({
  open,
  serviceId,
  action,
  devices = [],
  onClose,
}: {
  open: boolean;
  serviceId: string;
  action: ServiceAction | null;
  devices?: string[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [note, setNote] = useState("");
  const [device, setDevice] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) {
      setName("");
      setContact("");
      setNote("");
      setDevice("");
      setError("");
      setDone(false);
      setPending(false);
    }
  }, [open]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!action) return;
    setPending(true);
    setError("");
    try {
      const result = await submitInquiry({
        data: {
          serviceId,
          actionLabel: action.label,
          name,
          contact,
          note,
          device,
        },
      });
      if (!result.ok) {
        setError(result.error);
        setPending(false);
        return;
      }
      setDone(true);
      setPending(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not send that.");
      setPending(false);
    }
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className="w-[min(100%,28rem)] rounded-3xl bg-paper p-0 text-ink shadow-card backdrop:bg-ink/50"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <form onSubmit={onSubmit} className="space-y-4 p-6">
        <div>
          <p className="text-sm font-medium tracking-wide text-muted">
            {action?.kind === "quote" ? "Quote" : action?.kind === "call" ? "Call back" : "Request"}
          </p>
          <h2 id={titleId} className="mt-1 font-display text-3xl">
            {action?.label ?? "Tell the desk"}
          </h2>
        </div>
        {done ? (
          <p className="text-base text-ink">
            Sent. It is waiting in the desk, tied to this service.
          </p>
        ) : (
          <>
            <label className="block space-y-1 text-sm font-medium">
              Name
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-12 w-full rounded-xl bg-bone px-3 text-base font-normal shadow-card outline-none"
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              Phone or email
              <input
                required
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                className="h-12 w-full rounded-xl bg-bone px-3 text-base font-normal shadow-card outline-none"
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              Note
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={4}
                className="w-full rounded-xl bg-bone px-3 py-3 text-base font-normal shadow-card outline-none"
              />
            </label>
            {devices.length > 0 ? (
              <label className="block space-y-1 text-sm font-medium">
                Device
                <select
                  required
                  value={device}
                  onChange={(event) => setDevice(event.target.value)}
                  className="h-12 w-full rounded-xl bg-bone px-3 text-base font-normal shadow-card outline-none"
                >
                  <option value="">Choose a device</option>
                  {devices.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {error ? <p className="text-sm text-copper">{error}</p> : null}
          </>
        )}
        <div className="flex gap-2">
          {done ? null : (
            <button
              type="submit"
              disabled={pending}
              className="h-12 flex-1 rounded-full bg-copper px-4 text-base font-medium text-bone transition-transform duration-150 ease-out active:scale-[0.96] disabled:opacity-60"
            >
              {pending ? "Sending…" : "Send"}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-full px-4 text-base font-medium text-ink transition-transform duration-150 ease-out active:scale-[0.96]"
          >
            Close
          </button>
        </div>
      </form>
    </dialog>
  );
}
