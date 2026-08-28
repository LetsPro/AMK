/*
# Add CMS-managed visual media for About page and video testimonials

1. New Columns
- `website_pages.image_url` (text, nullable) — CMS-managed feature image URL for a website page (e.g. the About page hero image). Stored as a URL into the website media library bucket.
- `testimonials.video_url` (text, nullable) — optional client testimonial video URL from the website media library. Allows embedding a video alongside the existing text/photo testimonial.

2. Modified Storage Bucket
- Updates the `website` storage bucket to:
  - Raise the file size limit to 100 MB (104857600 bytes), keeping the existing limit if it was already higher.
  - Allow video MIME types (mp4, webm, quicktime) in addition to the existing image types (png, jpeg, webp).
- This enables admins to upload testimonial videos and page feature images to the same public website media bucket.

3. Important Notes
- This migration is idempotent: uses ADD COLUMN IF NOT EXISTS for both columns, and the storage bucket update uses greatest() to avoid lowering an existing higher limit.
- No RLS or policy changes — existing access controls on website_pages, testimonials, and the website storage bucket remain unchanged.
- Both new columns are nullable so existing rows are unaffected.
*/

alter table public.website_pages
  add column if not exists image_url text;

alter table public.testimonials
  add column if not exists video_url text;

comment on column public.website_pages.image_url is
  'CMS-managed feature image for the website page.';
comment on column public.testimonials.video_url is
  'Optional client testimonial video URL from the website media library.';

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
