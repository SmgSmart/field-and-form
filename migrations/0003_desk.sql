-- One admin login for the desk. No public sign-up after this row exists.

create table if not exists desk_account (
  id integer primary key,
  email text not null,
  password_hash text not null,
  failed_count integer not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  constraint desk_account_singleton check (id = 1)
);

create table if not exists desk_session (
  token_hash text primary key,
  expires_at timestamptz not null
);
