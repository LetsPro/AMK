-- Allow larger testimonial videos in the public website media bucket.
-- The Supabase project's global Storage limit must also be at least this high.
update storage.buckets
set
  file_size_limit = greatest(coalesce(file_size_limit, 0), 524288000),
  allowed_mime_types = array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
where id = 'website';
