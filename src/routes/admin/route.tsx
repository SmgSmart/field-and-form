import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { DeskLogin } from "@/components/desk-login";
import { getDeskStatus, signOutDesk, type DeskStatus } from "@/lib/desk.functions";
import { setDeskToken } from "@/lib/desk-session";
import { getAdminState } from "@/lib/studio.functions";
import type { AdminState } from "@/lib/studio.types";
import { AdminContext } from "./-desk-context";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const [status, setStatus] = useState<DeskStatus | null>(null);
  const [statusError, setStatusError] = useState("");

  const reloadStatus = useCallback(async () => {
    try {
      const next = await getDeskStatus();
      setStatus(next);
      setStatusError("");
    } catch (cause) {
      setStatusError(cause instanceof Error ? cause.message : "Could not open the desk.");
    }
  }, []);

  useEffect(() => {
    void reloadStatus();
  }, [reloadStatus]);

  async function signOut() {
    try {
      await signOutDesk();
    } catch {
      /* still drop the local token */
    }
    setDeskToken(null);
    setStatus((current) => (current ? { ...current, signedIn: false } : { configured: true, signedIn: false }));
  }

  if (!status) {
    return (
      <div className="min-h-screen bg-bone text-ink">
        {statusError ? (
          <main className="mx-auto max-w-lg px-5 py-16">
            <h1 className="font-display text-4xl">The desk is closed.</h1>
            <p className="mt-3 text-muted">{statusError}</p>
          </main>
        ) : (
          <DeskSkeleton />
        )}
      </div>
    );
  }

  if (!status.signedIn) {
    return (
      <div className="min-h-screen bg-bone text-ink">
        <DeskLogin configured={status.configured} onSignedIn={() => void reloadStatus()} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bone text-ink">
      <AdminShell onSignOut={signOut} />
    </div>
  );
}

function AdminShell({ onSignOut }: { onSignOut: () => Promise<void> }) {
  const [state, setState] = useState<AdminState | null>(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const result = await getAdminState();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setState(result.data);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not open the desk.");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (!state) {
    return error ? (
      <main className="mx-auto max-w-lg px-5 py-16">
        <h1 className="font-display text-4xl">The desk is closed.</h1>
        <p className="mt-3 text-muted">{error}</p>
        <button type="button" onClick={() => void onSignOut()} className="mt-6 text-sm font-medium text-copper">
          Back to login
        </button>
      </main>
    ) : (
      <DeskSkeleton />
    );
  }

  return (
    <AdminContext.Provider value={{ state, reload, signOut: onSignOut }}>
      <header className="sticky top-0 z-20 border-b border-line bg-bone/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-5">
          <Link to="/" className="min-w-0 truncate font-display text-xl">
            {state.studio.name}
          </Link>
          <div className="flex items-center gap-1">
            <p className="px-2 text-sm font-medium text-copper">Desk</p>
            <button
              type="button"
              onClick={() => void onSignOut()}
              className="inline-flex h-11 items-center rounded-full px-3 text-sm font-medium text-muted"
            >
              Sign out
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-5 pb-3">
          <DeskTab to="/admin" label="Main page" />
          <DeskTab to="/admin/services" label="Services" />
          <DeskTab to="/admin/inquiries" label="Inquiries" />
          <Link
            to="/"
            className="inline-flex h-11 items-center rounded-full px-3 text-sm font-medium text-muted"
          >
            View site
          </Link>
        </nav>
      </header>
      <Outlet />
    </AdminContext.Provider>
  );
}

function DeskTab({ to, label }: { to: "/admin" | "/admin/services" | "/admin/inquiries"; label: string }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: true }}
      className="inline-flex h-11 items-center rounded-full px-3 text-sm font-medium text-muted data-[status=active]:bg-ink data-[status=active]:text-bone"
    >
      {label}
    </Link>
  );
}

function DeskSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <div className="h-8 w-40 animate-pulse rounded-full bg-line" />
      <div className="mt-6 h-24 animate-pulse rounded-3xl bg-line" />
      <div className="mt-4 h-40 animate-pulse rounded-3xl bg-line" />
    </div>
  );
}
