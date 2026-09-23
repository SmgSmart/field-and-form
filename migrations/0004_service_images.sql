-- Up to three photos per service. Bytes live in the database so they survive deploy.

create table if not exists service_images (
  id text primary key,
  service_id text not null references services (id) on delete cascade,
  sort_order integer not null default 0,
  content_type text not null,
  data text not null
);

create index if not exists service_images_service_idx on service_images (service_id, sort_order);
