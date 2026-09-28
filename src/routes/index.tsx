import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { ServiceFace, ServiceMark } from "@/components/service-face";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { getCatalog } from "@/lib/studio.functions";
import type { Face } from "@/lib/studio.types";

export const Route = createFileRoute("/")({
  loader: () => getCatalog(),
  component: Home,
});

const FACES: Face[] = ["arc", "grid", "stripe", "ring"];

function Home() {
  const { studio, categories, services } = Route.useLoaderData();
  const featured = services.filter((service) => service.featured).slice(0, 4);

  return (
    <div className="min-h-screen bg-bone text-ink">
      <SiteHeader name={studio.name} />
      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <section className="pb-8 pt-8 sm:pt-14 lg:pt-16">
          <p className="rise text-sm font-medium tracking-wide text-copper">{studio.kicker}</p>
          <h1 className="rise rise-2 mt-3 max-w-3xl break-words font-display text-[2.05rem] leading-[1.15] text-ink sm:text-5xl lg:text-6xl">
            {studio.headline}
          </h1>
          <p className="rise rise-3 mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">{studio.lede}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/services"
              search={{ category: "all" }}
              className="inline-flex h-12 items-center rounded-full bg-ink px-5 text-base font-medium text-bone transition-transform duration-150 ease-out active:scale-[0.96]"
            >
              Browse services
            </Link>
            <p className="text-sm text-muted">{studio.city}</p>
          </div>
        </section>

        <section className="border-t border-line py-8">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="font-display text-2xl">Categories</h2>
            <p className="text-sm text-muted">Open one</p>
          </div>
          <ol className="divide-y divide-line border-y border-line">
            {categories.map((category, index) => {
              const count = services.filter((service) => service.categoryId === category.id).length;
              return (
                <li key={category.id}>
                  <Link
                    to="/services"
                    search={{ category: category.slug }}
                    className="group flex items-center gap-3 py-4 sm:gap-4"
                  >
                    {category.imageId ? (
                      <img
                        src={`/api/media/${category.imageId}`}
                        alt=""
                        className="size-14 shrink-0 rounded-2xl object-cover sm:size-16"
                      />
                    ) : (
                      <span className="w-8 shrink-0 font-display text-lg text-copper">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block break-words font-display text-xl leading-tight group-hover:text-copper sm:text-2xl">
                        {category.name}
                      </span>
                      <span className="mt-1 block break-words text-sm text-muted">{category.blurb}</span>
                    </span>
                    <span className="hidden text-sm text-muted sm:block">
                      {count} {count === 1 ? "service" : "services"}
                    </span>
                    <ArrowUpRight className="size-5 shrink-0 text-ink" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="py-8">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="font-display text-2xl">On the main page</h2>
            <Link to="/services" search={{ category: "all" }} className="text-sm font-medium text-copper">
              All services
            </Link>
          </div>
          <ul
            className={
              featured.length === 1
                ? "grid grid-cols-1 gap-4"
                : "grid grid-cols-1 gap-4 sm:grid-cols-2"
            }
          >
            {featured.map((service) => (
              <li key={service.id} className="min-w-0">
                <Link
                  to="/services/$slug"
                  params={{ slug: service.slug }}
                  className="flex h-full flex-col overflow-hidden rounded-3xl bg-paper shadow-card transition-[box-shadow] duration-150 hover:shadow-card-hover"
                >
                  <ServiceMark
                    face={service.face}
                    imageId={service.imageIds[0]}
                    className="aspect-[4/3] w-full sm:aspect-[16/10]"
                  />
                  <span className="flex min-w-0 flex-col gap-1 p-4">
                    <span className="text-sm text-copper">{service.categoryName}</span>
                    <span className="break-words font-display text-xl leading-tight sm:text-2xl">{service.name}</span>
                    {service.priceLabel ? <span className="text-sm text-muted">{service.priceLabel}</span> : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {featured.length === 0 ? (
            <p className="text-muted">Mark a service as featured in the desk and it will sit here.</p>
          ) : null}
        </section>

        <section className="grid gap-6 border-t border-line py-10 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["01", "Choose a category", "Home, gatherings, care, studio — or whatever you rename them to."],
            ["02", "Open the service", "Each one has its own page, with a face and the work written out."],
            ["03", "Use an action", "Request it, ask for a quote, or call. The note lands in the desk."],
          ].map(([step, title, copy]) => (
            <div key={step}>
              <p className="font-display text-lg text-copper">{step}</p>
              <h3 className="mt-2 font-display text-2xl">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{copy}</p>
            </div>
          ))}
        </section>
      </main>
      <div className="mx-auto w-full max-w-6xl px-4 pb-4 sm:px-6 lg:px-8">
        <ServiceFace
          face={FACES[0]}
          eyebrow={studio.city || "Studio"}
          title={studio.name}
          className="h-44 rounded-3xl sm:h-64 lg:h-80"
        />
      </div>
      <SiteFooter name={studio.name} city={studio.city} email={studio.email} phone={studio.phone} whatsapp={studio.whatsapp} />
    </div>
  );
}
