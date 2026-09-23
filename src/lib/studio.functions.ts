import { createServerFn } from "@tanstack/react-start";
import { getSql, type Sql } from "@/lib/db";
import { deskGate } from "@/lib/desk-middleware";
import {
  ACTION_KINDS,
  FACES,
  type ActionKind,
  type AdminState,
  type Catalog,
  type Category,
  type Face,
  type Inquiry,
  type Result,
  type Service,
  type ServiceAction,
  type ServiceDraft,
  type DraftImage,
  type Studio,
} from "@/lib/studio.types";

type StudioRow = {
  name: string;
  kicker: string;
  headline: string;
  lede: string;
  city: string;
  email: string;
  phone: string;
  owner_user_id: string | null;
};

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  blurb: string;
  sort_order: number;
};

type ServiceRow = {
  id: string;
  category_id: string;
  category_name: string;
  category_slug: string;
  name: string;
  slug: string;
  summary: string;
  story: string;
  price_label: string;
  duration_label: string;
  featured: boolean | string | number;
  published: boolean | string | number;
  face: string;
  sort_order: number;
};

type ActionRow = {
  id: string;
  service_id: string;
  label: string;
  kind: string;
  sort_order: number;
};

function asBool(value: unknown): boolean {
  return value === true || value === "t" || value === "true" || value === 1;
}

function asNum(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function asIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return "";
}

function isFace(value: string): value is Face {
  return (FACES as readonly string[]).includes(value);
}

function isKind(value: string): value is ActionKind {
  return (ACTION_KINDS as readonly string[]).includes(value);
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "service";
}

function mapStudio(row: StudioRow): Studio {
  return {
    name: row.name,
    kicker: row.kicker,
    headline: row.headline,
    lede: row.lede,
    city: row.city,
    email: row.email,
    phone: row.phone,
  };
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    blurb: row.blurb,
    sortOrder: asNum(row.sort_order),
  };
}

function mapAction(row: ActionRow): ServiceAction {
  return {
    id: row.id,
    label: row.label,
    kind: isKind(row.kind) ? row.kind : "inquire",
    sortOrder: asNum(row.sort_order),
  };
}

function mapService(row: ServiceRow, actions: ServiceAction[], imageIds: string[]): Service {
  return {
    id: row.id,
    categoryId: row.category_id,
    categoryName: row.category_name,
    categorySlug: row.category_slug,
    name: row.name,
    slug: row.slug,
    summary: row.summary,
    story: row.story,
    priceLabel: row.price_label,
    durationLabel: row.duration_label,
    featured: asBool(row.featured),
    published: asBool(row.published),
    face: isFace(row.face) ? row.face : "arc",
    sortOrder: asNum(row.sort_order),
    actions,
    imageIds,
  };
}

async function readStudio(sql: Sql): Promise<StudioRow> {
  const rows = await sql<StudioRow>`select name, kicker, headline, lede, city, email, phone, owner_user_id from studio where id = 1`;
  const row = rows[0];
  if (!row) throw new Error("Studio is not ready yet.");
  return row;
}

async function readCategories(sql: Sql): Promise<Category[]> {
  const rows = await sql<CategoryRow>`
    select id, name, slug, blurb, sort_order
    from categories
    order by sort_order, name
  `;
  return rows.map(mapCategory);
}

async function readServices(sql: Sql, publishedOnly: boolean): Promise<Service[]> {
  const rows = publishedOnly
    ? await sql<ServiceRow>`
        select s.id, s.category_id, c.name as category_name, c.slug as category_slug,
               s.name, s.slug, s.summary, s.story, s.price_label, s.duration_label,
               s.featured, s.published, s.face, s.sort_order
        from services s
        join categories c on c.id = s.category_id
        where s.published = true
        order by s.sort_order, s.name
      `
    : await sql<ServiceRow>`
        select s.id, s.category_id, c.name as category_name, c.slug as category_slug,
               s.name, s.slug, s.summary, s.story, s.price_label, s.duration_label,
               s.featured, s.published, s.face, s.sort_order
        from services s
        join categories c on c.id = s.category_id
        order by s.sort_order, s.name
      `;
  const actions = publishedOnly
    ? await sql<ActionRow>`
        select a.id, a.service_id, a.label, a.kind, a.sort_order
        from service_actions a
        join services s on s.id = a.service_id
        where s.published = true
        order by a.sort_order, a.label
      `
    : await sql<ActionRow>`
        select id, service_id, label, kind, sort_order
        from service_actions
        order by sort_order, label
      `;
  const byService = new Map<string, ServiceAction[]>();
  for (const action of actions) {
    const list = byService.get(action.service_id) ?? [];
    list.push(mapAction(action));
    byService.set(action.service_id, list);
  }
  const images = publishedOnly
    ? await sql<{ id: string; service_id: string }>`
        select i.id, i.service_id
        from service_images i
        join services s on s.id = i.service_id
        where s.published = true
        order by i.sort_order, i.id
      `
    : await sql<{ id: string; service_id: string }>`
        select id, service_id
        from service_images
        order by sort_order, id
      `;
  const imagesByService = new Map<string, string[]>();
  for (const image of images) {
    const list = imagesByService.get(image.service_id) ?? [];
    list.push(image.id);
    imagesByService.set(image.service_id, list);
  }
  return rows.map((row) => mapService(row, byService.get(row.id) ?? [], imagesByService.get(row.id) ?? []));
}

const DESK_OWNER = "desk";

async function requireDesk(sql: Sql, signedIn: boolean): Promise<Result<true>> {
  if (!signedIn) return { ok: false, error: "Sign in to the desk." };
  const current = await readStudio(sql);
  if (current.owner_user_id !== DESK_OWNER) {
    await sql`update studio set owner_user_id = ${DESK_OWNER} where id = 1`;
    await sql`update categories set owner_user_id = ${DESK_OWNER}`;
    await sql`update services set owner_user_id = ${DESK_OWNER}`;
  }
  return { ok: true, data: true };
}

async function uniqueSlug(
  sql: Sql,
  table: "categories" | "services",
  base: string,
  ignoreId?: string,
): Promise<string> {
  let slug = base;
  let n = 2;
  for (;;) {
    const rows =
      table === "categories"
        ? await sql<{ id: string }>`select id from categories where slug = ${slug}`
        : await sql<{ id: string }>`select id from services where slug = ${slug}`;
    if (!rows.some((row) => row.id !== ignoreId)) return slug;
    slug = `${base}-${n}`;
    n += 1;
  }
}

export const getCatalog = createServerFn({ method: "GET" }).handler(async (): Promise<Catalog> => {
  const sql = await getSql();
  const studio = mapStudio(await readStudio(sql));
  const categories = await readCategories(sql);
  const services = await readServices(sql, true);
  return { studio, categories, services };
});

export const getService = createServerFn({ method: "GET" })
  .validator((slug: string) => slug.trim())
  .handler(async ({ data: slug }): Promise<{ studio: Studio; service: Service | null; related: Service[] }> => {
    const sql = await getSql();
    const studio = mapStudio(await readStudio(sql));
    const services = await readServices(sql, true);
    const service = services.find((item) => item.slug === slug) ?? null;
    const related = service
      ? services.filter((item) => item.categoryId === service.categoryId && item.id !== service.id).slice(0, 3)
      : [];
    return { studio, service, related };
  });

export const submitInquiry = createServerFn({ method: "POST" })
  .validator((input: { serviceId: string; actionLabel: string; name: string; contact: string; note: string }) => {
    const name = input.name?.trim().slice(0, 80) ?? "";
    const contact = input.contact?.trim().slice(0, 120) ?? "";
    const note = input.note?.trim().slice(0, 1000) ?? "";
    const actionLabel = input.actionLabel?.trim().slice(0, 80) ?? "";
    const serviceId = input.serviceId?.trim() ?? "";
    if (!name) throw new Error("Add your name.");
    if (!contact) throw new Error("Add a phone or email.");
    if (!serviceId) throw new Error("Choose a service first.");
    return { serviceId, actionLabel, name, contact, note };
  })
  .handler(async ({ data }): Promise<Result<true>> => {
    const sql = await getSql();
    const found = await sql<{ id: string }>`
      select id from services where id = ${data.serviceId} and published = true
    `;
    if (!found[0]) return { ok: false, error: "That service is not open." };
    const id = crypto.randomUUID();
    await sql`
      insert into inquiries (id, service_id, action_label, name, contact, note)
      values (${id}, ${data.serviceId}, ${data.actionLabel}, ${data.name}, ${data.contact}, ${data.note})
    `;
    return { ok: true, data: true };
  });

export const getAdminState = createServerFn({ method: "GET" })
  .middleware([deskGate])
  .handler(async ({ context }): Promise<Result<AdminState>> => {
    const sql = await getSql();
    const claimed = await requireDesk(sql, context.deskSignedIn);
    if (!claimed.ok) return claimed;
    const studioRow = await readStudio(sql);
    const categories = await readCategories(sql);
    const services = await readServices(sql, false);
    const counts = await sql<{ count: number }>`select count(*)::int as count from inquiries`;
    return {
      ok: true,
      data: {
        studio: mapStudio(studioRow),
        categories,
        services,
        ownerSet: Boolean(studioRow.owner_user_id),
        inquiryCount: asNum(counts[0]?.count),
      },
    };
  });

export const saveStudio = createServerFn({ method: "POST" })
  .middleware([deskGate])
  .validator((input: Studio) => {
    const name = input.name?.trim().slice(0, 60) ?? "";
    if (!name) throw new Error("The studio needs a name.");
    return {
      name,
      kicker: input.kicker?.trim().slice(0, 80) ?? "",
      headline: input.headline?.trim().slice(0, 140) ?? "",
      lede: input.lede?.trim().slice(0, 400) ?? "",
      city: input.city?.trim().slice(0, 60) ?? "",
      email: input.email?.trim().slice(0, 120) ?? "",
      phone: input.phone?.trim().slice(0, 40) ?? "",
    } satisfies Studio;
  })
  .handler(async ({ context, data }): Promise<Result<Studio>> => {
    const sql = await getSql();
    const claimed = await requireDesk(sql, context.deskSignedIn);
    if (!claimed.ok) return claimed;
    if (!data.headline) return { ok: false, error: "Write a headline for the main page." };
    await sql`
      update studio
      set name = ${data.name},
          kicker = ${data.kicker},
          headline = ${data.headline},
          lede = ${data.lede},
          city = ${data.city},
          email = ${data.email},
          phone = ${data.phone},
          updated_at = now()
      where id = 1 and owner_user_id = ${DESK_OWNER}
    `;
    return { ok: true, data };
  });

export const saveCategory = createServerFn({ method: "POST" })
  .middleware([deskGate])
  .validator((input: { id?: string; name: string; blurb: string }) => {
    const name = input.name?.trim().slice(0, 40) ?? "";
    if (!name) throw new Error("Name the category.");
    return {
      id: input.id?.trim() || undefined,
      name,
      blurb: input.blurb?.trim().slice(0, 180) ?? "",
    };
  })
  .handler(async ({ context, data }): Promise<Result<Category>> => {
    const sql = await getSql();
    const claimed = await requireDesk(sql, context.deskSignedIn);
    if (!claimed.ok) return claimed;
    if (data.id) {
      const slugRows = await sql<{ slug: string }>`
        select slug from categories where id = ${data.id} and owner_user_id = ${DESK_OWNER}
      `;
      if (!slugRows[0]) return { ok: false, error: "That category is not yours." };
      await sql`
        update categories
        set name = ${data.name}, blurb = ${data.blurb}
        where id = ${data.id} and owner_user_id = ${DESK_OWNER}
      `;
      const rows = await sql<CategoryRow>`
        select id, name, slug, blurb, sort_order from categories where id = ${data.id}
      `;
      return { ok: true, data: mapCategory(rows[0]) };
    }
    const id = crypto.randomUUID();
    const slug = await uniqueSlug(sql, "categories", slugify(data.name));
    const orderRows = await sql<{ max: number | null }>`select max(sort_order) as max from categories`;
    const sortOrder = asNum(orderRows[0]?.max) + 1;
    await sql`
      insert into categories (id, owner_user_id, name, slug, blurb, sort_order)
      values (${id}, ${DESK_OWNER}, ${data.name}, ${slug}, ${data.blurb}, ${sortOrder})
    `;
    return {
      ok: true,
      data: { id, name: data.name, slug, blurb: data.blurb, sortOrder },
    };
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .middleware([deskGate])
  .validator((id: string) => id.trim())
  .handler(async ({ context, data: id }): Promise<Result<true>> => {
    const sql = await getSql();
    const claimed = await requireDesk(sql, context.deskSignedIn);
    if (!claimed.ok) return claimed;
    const used = await sql<{ id: string }>`select id from services where category_id = ${id} limit 1`;
    if (used[0]) return { ok: false, error: "Move or delete the services in this category first." };
    await sql`delete from categories where id = ${id} and owner_user_id = ${DESK_OWNER}`;
    return { ok: true, data: true };
  });

const IMAGE_LIMIT = 3;
const IMAGE_CHARS = 700_000;

function normalizeImages(input: DraftImage[] | undefined): DraftImage[] {
  const images: DraftImage[] = [];
  for (const image of (input ?? []).slice(0, IMAGE_LIMIT)) {
    const id = image.id?.trim();
    const dataUrl = image.dataUrl?.trim();
    if (id && !dataUrl) {
      images.push({ id });
      continue;
    }
    if (!dataUrl) continue;
    const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
    if (!match) throw new Error("Use a JPEG, PNG, or WebP photo.");
    if (match[2].length > IMAGE_CHARS) throw new Error("That photo is too large. Try a smaller one.");
    images.push({ dataUrl });
  }
  return images;
}

async function writeImages(sql: Sql, serviceId: string, images: DraftImage[]): Promise<void> {
  const owned = await sql<{ id: string }>`select id from service_images where service_id = ${serviceId}`;
  const ownedIds = new Set(owned.map((row) => row.id));
  const keep: string[] = [];
  for (let index = 0; index < images.length; index += 1) {
    const image = images[index];
    const sortOrder = index + 1;
    if (image.id && ownedIds.has(image.id)) {
      await sql`update service_images set sort_order = ${sortOrder} where id = ${image.id}`;
      keep.push(image.id);
      continue;
    }
    if (!image.dataUrl) continue;
    const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(image.dataUrl);
    if (!match) continue;
    const id = crypto.randomUUID();
    await sql`
      insert into service_images (id, service_id, sort_order, content_type, data)
      values (${id}, ${serviceId}, ${sortOrder}, ${match[1]}, ${match[2]})
    `;
    keep.push(id);
  }
  for (const row of owned) {
    if (!keep.includes(row.id)) await sql`delete from service_images where id = ${row.id}`;
  }
}

export const saveService = createServerFn({ method: "POST" })
  .middleware([deskGate])
  .validator((input: ServiceDraft): ServiceDraft => {
    const name = input.name?.trim().slice(0, 80) ?? "";
    const summary = input.summary?.trim().slice(0, 280) ?? "";
    const categoryId = input.categoryId?.trim() ?? "";
    if (!name) throw new Error("Name the service.");
    if (!summary) throw new Error("Add a short summary.");
    if (!categoryId) throw new Error("Choose a category.");
    const face = isFace(input.face) ? input.face : "arc";
    const actions = (input.actions ?? [])
      .map((action) => ({
        label: action.label?.trim().slice(0, 40) ?? "",
        kind: isKind(action.kind) ? action.kind : "inquire",
      }))
      .filter((action) => action.label)
      .slice(0, 3);
    if (actions.length === 0) throw new Error("Add at least one action.");
    const images = normalizeImages(input.images);
    return {
      id: input.id?.trim() || undefined,
      categoryId,
      name,
      summary,
      story: input.story?.trim().slice(0, 2000) ?? "",
      priceLabel: input.priceLabel?.trim().slice(0, 40) ?? "",
      durationLabel: input.durationLabel?.trim().slice(0, 40) ?? "",
      featured: Boolean(input.featured),
      published: Boolean(input.published),
      face,
      actions,
      images,
    };
  })
  .handler(async ({ context, data }): Promise<Result<Service>> => {
    const sql = await getSql();
    const claimed = await requireDesk(sql, context.deskSignedIn);
    if (!claimed.ok) return claimed;
    const category = await sql<{ id: string }>`
      select id from categories where id = ${data.categoryId} and owner_user_id = ${DESK_OWNER}
    `;
    if (!category[0]) return { ok: false, error: "That category is not on this studio." };

    let id = data.id;
    if (id) {
      const existing = await sql<{ id: string }>`
        select id from services where id = ${id} and owner_user_id = ${DESK_OWNER}
      `;
      if (!existing[0]) return { ok: false, error: "That service is not yours." };
      await sql`
        update services
        set category_id = ${data.categoryId},
            name = ${data.name},
            summary = ${data.summary},
            story = ${data.story},
            price_label = ${data.priceLabel},
            duration_label = ${data.durationLabel},
            featured = ${data.featured},
            published = ${data.published},
            face = ${data.face}
        where id = ${id} and owner_user_id = ${DESK_OWNER}
      `;
      await sql`delete from service_actions where service_id = ${id}`;
    } else {
      id = crypto.randomUUID();
      const slug = await uniqueSlug(sql, "services", slugify(data.name));
      const orderRows = await sql<{ max: number | null }>`select max(sort_order) as max from services`;
      const sortOrder = asNum(orderRows[0]?.max) + 1;
      await sql`
        insert into services (
          id, owner_user_id, category_id, name, slug, summary, story,
          price_label, duration_label, featured, published, face, sort_order
        ) values (
          ${id}, ${DESK_OWNER}, ${data.categoryId}, ${data.name}, ${slug}, ${data.summary}, ${data.story},
          ${data.priceLabel}, ${data.durationLabel}, ${data.featured}, ${data.published}, ${data.face}, ${sortOrder}
        )
      `;
    }

    for (let i = 0; i < data.actions.length; i += 1) {
      const action = data.actions[i];
      await sql`
        insert into service_actions (id, service_id, label, kind, sort_order)
        values (${crypto.randomUUID()}, ${id}, ${action.label}, ${action.kind}, ${i + 1})
      `;
    }

    await writeImages(sql, id, data.images);

    const services = await readServices(sql, false);
    const saved = services.find((service) => service.id === id);
    if (!saved) return { ok: false, error: "Saved, but the service could not be reloaded." };
    return { ok: true, data: saved };
  });

export const deleteService = createServerFn({ method: "POST" })
  .middleware([deskGate])
  .validator((id: string) => id.trim())
  .handler(async ({ context, data: id }): Promise<Result<true>> => {
    const sql = await getSql();
    const claimed = await requireDesk(sql, context.deskSignedIn);
    if (!claimed.ok) return claimed;
    await sql`delete from services where id = ${id} and owner_user_id = ${DESK_OWNER}`;
    return { ok: true, data: true };
  });

export const getInquiries = createServerFn({ method: "GET" })
  .middleware([deskGate])
  .handler(async ({ context }): Promise<Result<Inquiry[]>> => {
    const sql = await getSql();
    const claimed = await requireDesk(sql, context.deskSignedIn);
    if (!claimed.ok) return claimed;
    const rows = await sql<{
      id: string;
      service_id: string | null;
      service_name: string | null;
      action_label: string;
      name: string;
      contact: string;
      note: string;
      created_at: unknown;
    }>`
      select i.id, i.service_id, s.name as service_name, i.action_label, i.name, i.contact, i.note, i.created_at
      from inquiries i
      left join services s on s.id = i.service_id
      order by i.created_at desc
      limit 100
    `;
    return {
      ok: true,
      data: rows.map((row) => ({
        id: row.id,
        serviceId: row.service_id,
        serviceName: row.service_name,
        actionLabel: row.action_label,
        name: row.name,
        contact: row.contact,
        note: row.note,
        createdAt: asIso(row.created_at),
      })),
    };
  });

export const deleteInquiry = createServerFn({ method: "POST" })
  .middleware([deskGate])
  .validator((id: string) => id.trim())
  .handler(async ({ context, data: id }): Promise<Result<true>> => {
    const sql = await getSql();
    const claimed = await requireDesk(sql, context.deskSignedIn);
    if (!claimed.ok) return claimed;
    await sql`delete from inquiries where id = ${id}`;
    return { ok: true, data: true };
  });
