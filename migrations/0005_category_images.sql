-- One photo per category. Removed automatically when the category is deleted.

create table if not exists category_images (
  id text primary key,
  category_id text not null unique references categories (id) on delete cascade,
  content_type text not null,
  data text not null
);
