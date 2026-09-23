-- WhatsApp number for the service-page chat action.

alter table studio add column if not exists whatsapp text not null default '';
