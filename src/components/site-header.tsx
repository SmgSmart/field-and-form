import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/cn";

export function SiteHeader({
  name,
  mode = "site",
}: {
  name: string;
  mode?: "site" | "desk";
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bone/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-5">
        <Link to="/" className="min-w-0 truncate font-display text-xl text-ink">
          {name}
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium">
          <NavLink to="/services" search={{ category: "all" }} active={mode === "site"}>
            Services
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

function NavLink({
  to,
  search,
  active,
  children,
}: {
  to: "/services";
  search: { category: string };
  active: boolean;
  children: string;
}) {
  return (
    <Link
      to={to}
      search={search}
      className={cn(
        "inline-flex h-11 items-center rounded-full px-3",
        active ? "text-ink hover:bg-paper" : "text-muted hover:bg-paper hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}

export function whatsappLink(number: string, message?: string): string {
  const digits = number.replace(/\D/g, "");
  if (!digits) return "";
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function SiteFooter({
  name,
  city,
  email,
  phone,
  whatsapp = "",
}: {
  name: string;
  city: string;
  email: string;
  phone: string;
  whatsapp?: string;
}) {
  const chat = whatsappLink(whatsapp);
  return (
    <footer className="mt-16 bg-field text-bone">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link to="/admin" className="inline-flex min-h-11 items-center font-display text-3xl text-bone">
            {name}
          </Link>
          <p className="mt-2 text-sm text-bone/70">{city || "Set a city in the desk"}</p>
        </div>
        <div className="space-y-1 text-sm text-bone/80">
          {phone ? <p>{phone}</p> : null}
          {chat ? (
            <a href={chat} target="_blank" rel="noreferrer" className="block underline decoration-bone/40">
              WhatsApp
            </a>
          ) : null}
          {email ? <p>{email}</p> : null}
          {!phone && !email && !chat ? <p>Add a phone or email from the desk.</p> : null}
        </div>
      </div>
    </footer>
  );
}
