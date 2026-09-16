/*
# Add mixed photo/video support to portfolio galleries and elevation images for client projects

1. New Columns
- `portfolio_gallery.media_type` (text, not null, default 'image') — distinguishes image vs video gallery items. Existing rows are backfilled to 'image'.
- `client_projects.cover_image_url` (text, nullable) — optional elevation/cover image for a client project.

2. Constraints
- Adds a CHECK constraint on portfolio_gallery.media_type limiting values to 'image' or 'video'.

3. Storage Bucket Update
- Removes the file size limit on the 'website' bucket (set to null) so large video files can be uploaded via resumable uploads. Supabase still enforces the hosting plan's global maximum.
- Updates allowed MIME types to include images (png, jpeg, webp) and videos (mp4, webm, quicktime).

4. Important Notes
- Idempotent: uses ADD COLUMN IF NOT EXISTS, DROP CONSTRAINT IF EXISTS, and conditional backfill.
- No RLS or policy changes — existing access controls remain unchanged.
*/

alter table portfolio_gallery
add column if not exists media_type text not null default 'image';

update portfolio_gallery
set media_type = 'image'
where media_type is null or media_type not in ('image', 'video');

alter table portfolio_gallery
drop constraint if exists portfolio_gallery_media_type_check;

alter table portfolio_gallery
add constraint portfolio_gallery_media_type_check
check (media_type in ('image', 'video'));

alter table client_projects
add column if not exists cover_image_url text;

update storage.buckets
set
  file_size_limit = null,
  allowed_mime_types = array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
where id = 'website';
