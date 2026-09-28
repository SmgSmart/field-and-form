import { createFileRoute, Link } from "@tanstack/react-router";
import { ServiceFace, ServiceMark } from "@/components/service-face";
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
      <main className="mx-auto w-full max-w-6xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <p className="text-sm font-medium tracking-wide text-copper">Services</p>
        <h1 className="mt-2 max-w-2xl break-words font-display text-[2.05rem] leading-tight sm:text-5xl">
          {active ? active.name : "Every service, by category"}
        </h1>
        <p className="mt-3 max-w-xl text-base text-muted">
          {active ? active.blurb : "Press a category. It opens that set, and each card opens the service."}
        </p>

        <div className="mt-6 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
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

        {active?.imageId ? (
          <div className="relative mt-6 aspect-[4/3] overflow-hidden rounded-3xl sm:aspect-[16/9]">
            <img src={`/api/media/${active.imageId}`} alt="" className="absolute inset-0 size-full object-cover" />
            <div className="absolute inset-0 bg-ink/40" />
            <div className="relative flex h-full flex-col justify-end gap-2 p-5 sm:p-7">
              <p className="text-sm font-medium tracking-wide text-bone/80">
                {visible.length} {visible.length === 1 ? "service" : "services"}
              </p>
              <p className="font-display text-3xl leading-tight text-bone sm:text-5xl">{active.name}</p>
            </div>
          </div>
        ) : (
          <ServiceFace
            face={face}
            eyebrow={
              active
                ? `${visible.length} ${visible.length === 1 ? "service" : "services"}`
                : `${visible.length} services`
            }
            title={active ? active.name : studio.name}
            className="mt-6 aspect-[4/3] rounded-3xl sm:aspect-[16/9]"
          />
        )}

        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((service) => (
            <li key={service.id} className="min-w-0">
              <Link
                to="/services/$slug"
                params={{ slug: service.slug }}
                className="flex h-full flex-col overflow-hidden rounded-3xl bg-paper shadow-card transition-[box-shadow] duration-150 hover:shadow-card-hover"
              >
                <ServiceMark face={service.face} imageId={service.imageIds[0]} className="aspect-[16/10] w-full" />
                <span className="block min-w-0 px-4 pb-4 pt-3">
                  <span className="text-sm text-copper">{service.categoryName}</span>
                  <span className="mt-1 block break-words font-display text-xl leading-tight sm:text-2xl">{service.name}</span>
                  <span className="mt-2 block break-words text-sm leading-relaxed text-muted">{service.summary}</span>
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
      <SiteFooter name={studio.name} city={studio.city} email={studio.email} phone={studio.phone} whatsapp={studio.whatsapp} />
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
