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
          <Link
            to="/admin"
            className={cn(
              "inline-flex h-11 items-center rounded-full px-3",
              mode === "desk" ? "bg-ink text-bone" : "text-ink hover:bg-paper",
            )}
          >
            Desk
          </Link>
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

export function SiteFooter({
  name,
  city,
  email,
  phone,
}: {
  name: string;
  city: string;
  email: string;
  phone: string;
}) {
  return (
    <footer className="mt-16 bg-field text-bone">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-3xl">{name}</p>
          <p className="mt-2 text-sm text-bone/70">{city || "Set a city in the desk"}</p>
        </div>
        <div className="space-y-1 text-sm text-bone/80">
          {phone ? <p>{phone}</p> : null}
          {email ? <p>{email}</p> : null}
          {!phone && !email ? <p>Add a phone or email from the desk.</p> : null}
        </div>
      </div>
    </footer>
  );
}
