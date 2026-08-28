-- Add CMS-managed visual media for the About page and video testimonials.
alter table public.website_pages
  add column if not exists image_url text;

alter table public.testimonials
  add column if not exists video_url text;

comment on column public.website_pages.image_url is 'CMS-managed feature image for the website page.';
comment on column public.testimonials.video_url is 'Optional client testimonial video URL from the website media library.';

-- Testimonial videos share the public website media bucket.
update storage.buckets
set
  file_size_limit = greatest(coalesce(file_size_limit, 0), 104857600),
  allowed_mime_types = array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
where id = 'website';
