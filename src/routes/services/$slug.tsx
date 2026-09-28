import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { InquiryDialog } from "@/components/inquiry-dialog";
import { ServiceFace } from "@/components/service-face";
import { SiteFooter, SiteHeader, whatsappLink } from "@/components/site-header";
import { getService } from "@/lib/studio.functions";
import type { ServiceAction } from "@/lib/studio.types";

export const Route = createFileRoute("/services/$slug")({
  loader: ({ params }) => getService({ data: params.slug }),
  component: ServicePage,
});

function ServicePage() {
  const { studio, service, related } = Route.useLoaderData();
  const [action, setAction] = useState<ServiceAction | null>(null);
  const [shot, setShot] = useState(0);

  if (!service) {
    return (
      <div className="min-h-screen bg-bone text-ink">
        <SiteHeader name={studio.name} />
        <main className="mx-auto max-w-5xl px-5 py-16">
          <h1 className="font-display text-4xl">That service is not listed.</h1>
          <Link
            to="/services"
            search={{ category: "all" }}
            className="mt-6 inline-flex h-12 items-center text-copper"
          >
            Back to services
          </Link>
        </main>
      </div>
    );
  }

  const phoneHref = studio.phone ? `tel:${studio.phone.replace(/[^\d+]/g, "")}` : "";
  const whatsappHref = whatsappLink(studio.whatsapp, `Hello, I would like to ask about ${service.name}.`);

  return (
    <div className="min-h-screen bg-bone text-ink">
      <SiteHeader name={studio.name} />
      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-8">
        <Link
          to="/services"
          search={{ category: service.categorySlug }}
          className="inline-flex h-11 items-center text-sm font-medium text-muted"
        >
          {service.categoryName}
        </Link>
        {service.imageIds.length > 0 ? (
          <div className="mt-2">
            <img
              src={`/api/media/${service.imageIds[shot] ?? service.imageIds[0]}`}
              alt={`${service.name}`}
              className="aspect-[4/3] w-full rounded-3xl bg-field object-cover sm:aspect-[16/9]"
            />
            {service.imageIds.length > 1 ? (
              <div className="mt-3 grid grid-cols-3 gap-3">
                {service.imageIds.map((id, index) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setShot(index)}
                    aria-pressed={shot === index}
                    className={
                      shot === index
                        ? "overflow-hidden rounded-2xl ring-2 ring-copper"
                        : "overflow-hidden rounded-2xl ring-1 ring-line"
                    }
                  >
                    <img src={`/api/media/${id}`} alt="" className="h-20 w-full object-cover sm:h-24" />
                  </button>
                ))}
              </div>
            ) : null}
            <h1 className="mt-5 break-words font-display text-[2.05rem] leading-tight sm:text-5xl">{service.name}</h1>
          </div>
        ) : (
          <ServiceFace
            face={service.face}
            eyebrow={service.categoryName}
            title={service.name}
            titleAs="h1"
            className="mt-2 aspect-[4/3] rounded-3xl sm:aspect-[16/9]"
          />
        )}
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
          {service.priceLabel ? <p>{service.priceLabel}</p> : null}
          {service.durationLabel ? <p>{service.durationLabel}</p> : null}
        </div>
        <p className="mt-4 max-w-2xl break-words text-base leading-relaxed sm:text-lg">{service.summary}</p>
        {service.story ? (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">{service.story}</p>
        ) : null}

        <div className="mt-8">
          <h2 className="font-display text-2xl">Actions</h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {service.actions.map((item, index) => {
              const primary = index === 0;
              const className = primary
                ? "inline-flex h-12 items-center justify-center rounded-full bg-copper px-5 text-base font-medium text-bone transition-transform duration-150 ease-out active:scale-[0.96]"
                : "inline-flex h-12 items-center justify-center rounded-full bg-paper px-5 text-base font-medium text-ink shadow-card transition-transform duration-150 ease-out active:scale-[0.96]";
              if (item.kind === "call" && phoneHref) {
                return (
                  <a key={item.id} href={phoneHref} className={className}>
                    {item.label}
                  </a>
                );
              }
              if (item.kind === "whatsapp" && whatsappHref) {
                return (
                  <a key={item.id} href={whatsappHref} target="_blank" rel="noreferrer" className={className}>
                    {item.label}
                  </a>
                );
              }
              return (
                <button key={item.id} type="button" className={className} onClick={() => setAction(item)}>
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {related.length > 0 ? (
          <section className="mt-12 border-t border-line pt-8">
            <h2 className="font-display text-2xl">Also in {service.categoryName}</h2>
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <li key={item.id}>
                  <Link
                    to="/services/$slug"
                    params={{ slug: item.slug }}
                    className="block rounded-2xl bg-paper p-4 shadow-card"
                  >
                    <span className="block break-words font-display text-xl">{item.name}</span>
                    <span className="mt-1 block text-sm text-muted">{item.priceLabel}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
      <SiteFooter
        name={studio.name}
        city={studio.city}
        email={studio.email}
        phone={studio.phone}
        whatsapp={studio.whatsapp}
      />
      <InquiryDialog
        open={action !== null}
        serviceId={service.id}
        action={action}
        devices={service.devices}
        onClose={() => setAction(null)}
      />
    </div>
  );
}
