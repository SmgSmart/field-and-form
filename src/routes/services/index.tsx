import { createFileRoute, Link } from "@tanstack/react-router";
import { ServiceFace } from "@/components/service-face";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { cn } from "@/lib/cn";
import { getCatalog } from "@/lib/studio.functions";
import type { Face } from "@/lib/studio.types";

const FACES: Face[] = ["arc", "grid", "stripe", "ring"];

export const Route = createFileRoute("/services/")({
  validateSearch: (search: Record<string, unknown>): { category: string } => ({
    category: typeof search.category === "string" && search.category ? search.category : "all",
  }),
  loader: () => getCatalog(),
  component: ServicesPage,
});

function ServicesPage() {
  const { studio, categories, services } = Route.useLoaderData();
  const { category } = Route.useSearch();
  const active = categories.find((item) => item.slug === category) ?? null;
  const visible = active ? services.filter((service) => service.categoryId === active.id) : services;
  const face = active ? FACES[categories.findIndex((item) => item.id === active.id) % FACES.length] : "ring";

  return (
    <div className="min-h-screen bg-bone text-ink">
      <SiteHeader name={studio.name} />
      <main className="mx-auto max-w-5xl px-5 pb-12 pt-8">
        <p className="text-sm font-medium tracking-wide text-copper">Services</p>
        <h1 className="mt-2 max-w-2xl font-display text-4xl sm:text-5xl">
          {active ? active.name : "Every service, by category"}
        </h1>
        <p className="mt-3 max-w-xl text-base text-muted">
          {active ? active.blurb : "Press a category. It opens that set, and each card opens the service."}
        </p>

        <div className="mt-6 -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
          <CategoryChip slug="all" label="All" current={category === "all" || !active} />
          {categories.map((item) => (
            <CategoryChip
              key={item.id}
              slug={item.slug}
              label={item.name}
              current={item.slug === active?.slug}
            />
          ))}
        </div>

        <ServiceFace
          face={face}
          eyebrow={
            active
              ? `${visible.length} ${visible.length === 1 ? "service" : "services"}`
              : `${visible.length} services`
          }
          title={active ? active.name : studio.name}
          className="mt-6 h-56 rounded-3xl sm:h-72"
        />

        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {visible.map((service) => (
            <li key={service.id}>
              <Link
                to="/services/$slug"
                params={{ slug: service.slug }}
                className="block rounded-3xl bg-paper p-2 shadow-card transition-[box-shadow] duration-150 hover:shadow-card-hover"
              >
                <ServiceFace face={service.face} className="h-36 rounded-2xl" />
                <span className="block px-3 pb-3 pt-3">
                  <span className="text-sm text-copper">{service.categoryName}</span>
                  <span className="mt-1 block font-display text-2xl">{service.name}</span>
                  <span className="mt-2 block text-sm leading-relaxed text-muted">{service.summary}</span>
                  <span className="mt-3 flex items-center justify-between text-sm">
                    <span>{service.priceLabel}</span>
                    <span className="text-muted">{service.durationLabel}</span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {visible.length === 0 ? (
          <p className="mt-8 text-muted">Nothing is published in this category yet.</p>
        ) : null}
      </main>
      <SiteFooter name={studio.name} city={studio.city} email={studio.email} phone={studio.phone} />
    </div>
  );
}

function CategoryChip({ slug, label, current }: { slug: string; label: string; current: boolean }) {
  return (
    <Link
      to="/services"
      search={{ category: slug }}
      className={cn(
        "inline-flex h-11 shrink-0 items-center rounded-full px-4 text-sm font-medium",
        current ? "bg-ink text-bone" : "bg-paper text-ink shadow-card",
      )}
    >
      {label}
    </Link>
  );
}
