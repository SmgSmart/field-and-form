-- Devices a visitor can choose when they request a service.

create table if not exists service_devices (
  id text primary key,
  service_id text not null references services (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0
);

create index if not exists service_devices_service_idx on service_devices (service_id, sort_order);

alter table inquiries add column if not exists device text not null default '';
