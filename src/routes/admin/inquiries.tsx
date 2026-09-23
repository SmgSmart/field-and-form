import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { deleteInquiry, getInquiries } from "@/lib/studio.functions";
import type { Inquiry } from "@/lib/studio.types";
import { useAdmin } from "./-desk-context";

export const Route = createFileRoute("/admin/inquiries")({
  component: InquiriesPage,
});

function InquiriesPage() {
  const { reload } = useAdmin();
  const [rows, setRows] = useState<Inquiry[] | null>(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      const result = await getInquiries();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setRows(result.data);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load inquiries.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function remove(id: string) {
    const result = await deleteInquiry({ data: id });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await load();
    await reload();
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <h1 className="font-display text-4xl">Inquiries</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
        Notes people send from a service action. Only the desk can see them.
      </p>
      {error ? <p className="mt-4 text-sm text-copper">{error}</p> : null}
      {rows === null ? (
        <div className="mt-6 h-28 animate-pulse rounded-3xl bg-line" />
      ) : rows.length === 0 ? (
        <p className="mt-8 text-muted">None yet. Open a service on the site and send a request.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((row) => (
            <li key={row.id} className="rounded-3xl bg-paper p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{row.name}</p>
                  <p className="text-sm text-muted">{row.contact}</p>
                </div>
                <button type="button" onClick={() => remove(row.id)} className="h-11 text-sm text-copper">
                  Clear
                </button>
              </div>
              <p className="mt-3 text-sm">
                <span className="text-copper">{row.actionLabel || "Request"}</span>
                {row.serviceName ? <span className="text-muted"> · {row.serviceName}</span> : null}
              </p>
              {row.note ? <p className="mt-2 text-base leading-relaxed">{row.note}</p> : null}
              <p className="mt-3 text-sm text-muted">
                {row.createdAt ? format(new Date(row.createdAt), "d MMM yyyy, HH:mm") : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
