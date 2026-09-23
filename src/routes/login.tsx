import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DeskLogin } from "@/components/desk-login";
import { getDeskStatus, type DeskStatus } from "@/lib/desk.functions";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<DeskStatus | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void getDeskStatus()
      .then((next) => {
        setStatus(next);
        if (next.signedIn) void navigate({ to: "/admin" });
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : "Could not open the login.");
      });
  }, [navigate]);

  if (!status) {
    return (
      <main className="grid min-h-screen place-items-center bg-bone px-6 text-ink">
        <p className="text-sm text-muted">{error || "Opening the desk…"}</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-bone text-ink">
      <DeskLogin configured={status.configured} onSignedIn={() => void navigate({ to: "/admin" })} />
    </div>
  );
}
