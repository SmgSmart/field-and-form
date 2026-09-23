import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { SignInGate } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { GROK_PROVIDERS, signIn } from "@/lib/auth/client";
import { getAdminState } from "@/lib/studio.functions";
import type { AdminState } from "@/lib/studio.types";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

type AdminContextValue = {
  state: AdminState;
  reload: () => Promise<void>;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdmin() {
  const value = useContext(AdminContext);
  if (!value) throw new Error("Desk data is not ready.");
  return value;
}

function AdminLayout() {
  const { isPending } = useCurrentUserState();
  return (
    <div className="min-h-screen bg-bone text-ink">
      {isPending ? <DeskSkeleton /> : (
        <SignInGate fallback={<DeskSignIn />}>
          <AdminShell />
        </SignInGate>
      )}
    </div>
  );
}

function AdminShell() {
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
      </main>
    ) : (
      <DeskSkeleton />
    );
  }

  return (
    <AdminContext.Provider value={{ state, reload }}>
      <header className="sticky top-0 z-20 border-b border-line bg-bone/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-5">
          <Link to="/" className="min-w-0 truncate font-display text-xl">
            {state.studio.name}
          </Link>
          <p className="text-sm font-medium text-copper">Desk</p>
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

function DeskSignIn() {
  return (
    <main className="mx-auto grid min-h-screen max-w-sm place-items-center px-6">
      <div className="space-y-4">
        <p className="text-sm font-medium tracking-wide text-copper">Studio desk</p>
        <h1 className="font-display text-4xl">Sign in to list your services.</h1>
        <div className={cn("space-y-2")}>
          {GROK_PROVIDERS.map((provider) => (
            <button
              key={provider.providerId}
              type="button"
              onClick={() => signIn(provider.providerId, { callbackURL: "/admin" })}
              className="h-12 w-full rounded-full bg-ink text-base font-medium text-bone"
            >
              Continue with {provider.label}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
