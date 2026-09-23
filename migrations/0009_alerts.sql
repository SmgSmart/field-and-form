-- Key that lets the desk send each enquiry to the studio WhatsApp.

alter table studio add column if not exists whatsapp_key text not null default '';
