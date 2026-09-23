import { Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { createDeskAdmin, signInDesk } from "@/lib/desk.functions";
import { setDeskToken } from "@/lib/desk-session";

export function DeskLogin({
  configured,
  onSignedIn,
}: {
  configured: boolean;
  onSignedIn: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!configured && password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setPending(true);
    try {
      const result = configured
        ? await signInDesk({ data: { email, password } })
        : await createDeskAdmin({ data: { email, password } });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDeskToken(result.data.token);
      onSignedIn();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not open the desk.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5 py-10">
      <p className="text-sm font-medium tracking-wide text-copper">Studio desk</p>
      <h1 className="mt-2 font-display text-4xl">
        {configured ? "Admin login" : "Create your admin login"}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        {configured
          ? "Only the email and password you created can open the desk. The public site stays open."
          : "You will be the only person who can open the desk. Choose an email and a password and keep them. There is no second account."}
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-3 rounded-3xl bg-paper p-5 shadow-card">
        <label className="block space-y-1 text-sm font-medium">
          Email
          <input
            type="email"
            name="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-12 w-full rounded-xl bg-bone px-3 text-base font-normal shadow-card outline-none"
          />
        </label>
        <label className="block space-y-1 text-sm font-medium">
          Password
          <span className="flex gap-2">
            <input
              type={show ? "text" : "password"}
              name="password"
              autoComplete={configured ? "current-password" : "new-password"}
              required
              minLength={configured ? undefined : 8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 min-w-0 flex-1 rounded-xl bg-bone px-3 text-base font-normal shadow-card outline-none"
            />
            <button
              type="button"
              onClick={() => setShow((value) => !value)}
              className="h-12 shrink-0 rounded-xl px-3 text-sm font-medium text-muted"
            >
              {show ? "Hide" : "Show"}
            </button>
          </span>
        </label>
        {configured ? null : (
          <label className="block space-y-1 text-sm font-medium">
            Confirm password
            <input
              type={show ? "text" : "password"}
              name="confirm"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className="h-12 w-full rounded-xl bg-bone px-3 text-base font-normal shadow-card outline-none"
            />
          </label>
        )}
        {error ? <p className="text-sm text-copper">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="h-12 w-full rounded-full bg-ink text-base font-medium text-bone transition-transform duration-150 ease-out active:scale-[0.96] disabled:opacity-60"
        >
          {pending ? "Checking…" : configured ? "Sign in" : "Create login"}
        </button>
      </form>
      <Link to="/" className="mt-6 inline-flex h-11 items-center text-sm font-medium text-muted">
        Back to the site
      </Link>
    </main>
  );
}
