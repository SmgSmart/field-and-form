export const FACES = ["arc", "grid", "stripe", "ring"] as const;
export const ACTION_KINDS = ["inquire", "quote", "call"] as const;

export type Face = (typeof FACES)[number];
export type ActionKind = (typeof ACTION_KINDS)[number];

export type Studio = {
  name: string;
  kicker: string;
  headline: string;
  lede: string;
  city: string;
  email: string;
  phone: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  blurb: string;
  sortOrder: number;
};

export type ServiceAction = {
  id: string;
  label: string;
  kind: ActionKind;
  sortOrder: number;
};

export type Service = {
  id: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  name: string;
  slug: string;
  summary: string;
  story: string;
  priceLabel: string;
  durationLabel: string;
  featured: boolean;
  published: boolean;
  face: Face;
  sortOrder: number;
  actions: ServiceAction[];
  imageIds: string[];
};

export type Inquiry = {
  id: string;
  serviceId: string | null;
  serviceName: string | null;
  actionLabel: string;
  name: string;
  contact: string;
  note: string;
  createdAt: string;
};

export type Catalog = {
  studio: Studio;
  categories: Category[];
  services: Service[];
};

export type AdminState = Catalog & {
  ownerSet: boolean;
  inquiryCount: number;
};

export type DraftImage = {
  id?: string;
  dataUrl?: string;
};

export type ServiceDraft = {
  id?: string;
  categoryId: string;
  name: string;
  summary: string;
  story: string;
  priceLabel: string;
  durationLabel: string;
  featured: boolean;
  published: boolean;
  face: Face;
  actions: { label: string; kind: ActionKind }[];
  images: DraftImage[];
};

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };
