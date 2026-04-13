-- Optional full-bleed image for each saved topic (paste a direct image URL in settings).

alter table public.topics add column if not exists image_url text;

comment on column public.topics.image_url is 'HTTPS URL to a JPG/PNG/WebP used as the topic card background.';
