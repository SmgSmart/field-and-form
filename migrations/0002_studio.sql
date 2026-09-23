-- Service house: one studio, categories, services, actions, and private inquiries.

create table if not exists studio (
  id integer primary key,
  owner_user_id text,
  name text not null,
  kicker text not null,
  headline text not null,
  lede text not null,
  city text not null,
  email text not null,
  phone text not null,
  updated_at timestamptz not null default now(),
  constraint studio_singleton check (id = 1)
);

create table if not exists categories (
  id text primary key,
  owner_user_id text,
  name text not null,
  slug text not null unique,
  blurb text not null default '',
  sort_order integer not null default 0
);

create table if not exists services (
  id text primary key,
  owner_user_id text,
  category_id text not null references categories (id) on delete restrict,
  name text not null,
  slug text not null unique,
  summary text not null,
  story text not null default '',
  price_label text not null default '',
  duration_label text not null default '',
  featured boolean not null default false,
  published boolean not null default true,
  face text not null default 'arc',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists services_category_idx on services (category_id);
create index if not exists services_published_idx on services (published);

create table if not exists service_actions (
  id text primary key,
  service_id text not null references services (id) on delete cascade,
  label text not null,
  kind text not null,
  sort_order integer not null default 0
);

create index if not exists service_actions_service_idx on service_actions (service_id);

create table if not exists inquiries (
  id text primary key,
  service_id text references services (id) on delete set null,
  action_label text not null default '',
  name text not null,
  contact text not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

insert into studio (id, name, kicker, headline, lede, city, email, phone)
values (
  1,
  'Field & Form',
  'Service house · Accra',
  'Name the work. We’ll take it from there.',
  'A short list of services, sorted by the kind of help you need. Open one, then use its action — a request, a quote, or a call.',
  'Accra',
  '',
  ''
)
on conflict (id) do nothing;

insert into categories (id, name, slug, blurb, sort_order) values
  ('cat-home', 'Home', 'home', 'Rooms, gardens, and the fabric of a house.', 1),
  ('cat-gatherings', 'Gatherings', 'gatherings', 'Tables, launches, and evenings with guests.', 2),
  ('cat-care', 'Care', 'care', 'Steady help for the week, not a one-off scramble.', 3),
  ('cat-studio', 'Studio', 'studio', 'Pictures, words, and the public face of the work.', 4)
on conflict (id) do nothing;

insert into services (
  id, category_id, name, slug, summary, story, price_label, duration_label,
  featured, published, face, sort_order
) values
  (
    'svc-room', 'cat-home', 'Room reset', 'room-reset',
    'A room returned to itself — surfaces, storage, and the things that had nowhere to live.',
    'We walk the room with you, decide what stays, and leave it usable the same day. No product truck. A plan, then the work.',
    'From GHS 450', 'Half day', true, true, 'arc', 1
  ),
  (
    'svc-garden', 'cat-home', 'Garden tidy', 'garden-tidy',
    'Edges, pots, and the path from gate to door, put back in order.',
    'A morning on the grounds you already have. We cut, sweep, and reset pots so the approach to the house looks looked-after.',
    'From GHS 300', 'A morning', false, true, 'grid', 2
  ),
  (
    'svc-table', 'cat-gatherings', 'Evening table', 'evening-table',
    'A seated evening for up to fourteen — menu direction, the table, and the leaving.',
    'You host. We shape the hour: how people sit, what is served, and how the room is left. Built for a home, not a hall.',
    'From GHS 1,800', 'One evening', true, true, 'ring', 3
  ),
  (
    'svc-launch', 'cat-gatherings', 'Launch gathering', 'launch-gathering',
    'A small public opening: guest flow, the room, and the hour people remember.',
    'For a practice, a shop, or a first showing. We plan the sequence of the night so you are not also the floor manager.',
    'From GHS 2,400', 'Planning + night', false, true, 'stripe', 4
  ),
  (
    'svc-weekday', 'cat-care', 'Weekday household', 'weekday-household',
    'A recurring pair of hands for laundry, kitchen, and the midweek reset.',
    'The same person, the same rhythm. You set the list once. We keep the week from stacking up.',
    'From GHS 280 / visit', 'Weekly', true, true, 'stripe', 5
  ),
  (
    'svc-portrait', 'cat-studio', 'Portrait sitting', 'portrait-sitting',
    'A quiet sitting for a person, a pair, or a small team — edited and delivered.',
    'One location, natural light, no set. You leave with a short edited set you can actually use.',
    'From GHS 900', '90 minutes', true, true, 'arc', 6
  ),
  (
    'svc-offer', 'cat-studio', 'Offer page', 'offer-page',
    'The words and structure for one service you sell, so a stranger understands it.',
    'We write a single page: what it is, who it is for, what happens next. You keep the voice. We keep it clear.',
    'From GHS 650', 'One week', false, true, 'grid', 7
  )
on conflict (id) do nothing;

insert into service_actions (id, service_id, label, kind, sort_order) values
  ('act-room-1', 'svc-room', 'Request this reset', 'inquire', 1),
  ('act-room-2', 'svc-room', 'Ask for a quote', 'quote', 2),
  ('act-garden-1', 'svc-garden', 'Request a tidy', 'inquire', 1),
  ('act-garden-2', 'svc-garden', 'Ask for a quote', 'quote', 2),
  ('act-table-1', 'svc-table', 'Request this evening', 'inquire', 1),
  ('act-table-2', 'svc-table', 'Ask for a quote', 'quote', 2),
  ('act-launch-1', 'svc-launch', 'Plan a launch', 'inquire', 1),
  ('act-launch-2', 'svc-launch', 'Ask for a quote', 'quote', 2),
  ('act-weekday-1', 'svc-weekday', 'Start weekday care', 'inquire', 1),
  ('act-weekday-2', 'svc-weekday', 'Call the desk', 'call', 2),
  ('act-portrait-1', 'svc-portrait', 'Book a sitting', 'inquire', 1),
  ('act-portrait-2', 'svc-portrait', 'Ask for a quote', 'quote', 2),
  ('act-offer-1', 'svc-offer', 'Commission a page', 'inquire', 1),
  ('act-offer-2', 'svc-offer', 'Ask for a quote', 'quote', 2)
on conflict (id) do nothing;
