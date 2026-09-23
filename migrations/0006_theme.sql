-- Saved appearance. A preset id, or a JSON theme written from the desk.

alter table studio add column if not exists theme text not null default 'field';
