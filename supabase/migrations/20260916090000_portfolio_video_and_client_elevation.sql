/*
  Add mixed photo/video support to portfolio galleries and an elevation image
  for client projects. Existing gallery rows remain images.
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

-- Remove the bucket-level cap. Supabase still enforces the hosting plan's global
-- maximum, while the app uses resumable uploads for large video files.
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
