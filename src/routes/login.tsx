import { createFileRoute } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  return (
    <main className="grid min-h-screen place-items-center bg-bone px-6 text-ink">
      <div className="w-full max-w-sm space-y-4">
        <p className="text-sm font-medium tracking-wide text-copper">Studio desk</p>
        <h1 className="font-display text-4xl">Sign in to edit the house.</h1>
        <p className="text-sm leading-relaxed text-muted">
          The public site stays open. Signing in is only for the desk — services, categories, and the main page.
        </p>
        {authEnabled ? (
          GROK_PROVIDERS.map((provider) => (
            <button
              key={provider.providerId}
              type="button"
              onClick={() => signIn(provider.providerId, { callbackURL: "/admin" })}
              className="h-12 w-full rounded-full bg-ink text-base font-medium text-bone transition-transform duration-150 ease-out active:scale-[0.96]"
            >
              Continue with {provider.label}
            </button>
          ))
        ) : (
          <p className="text-sm text-muted">Sign-in is disabled.</p>
        )}
      </div>
    </main>
  );
}
