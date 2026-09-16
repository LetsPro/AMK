/*
# Add multi-attachment support to material recommendations

1. New Column
- `material_recommendations.attachments` (jsonb, not null, default '[]') — a flexible JSON array allowing any number of image, video, and document attachments per material guide. Each attachment is an object with `kind` (image/video/document), `url`, and `name` fields.

2. Data Backfill
- Existing recommendations that have values in the legacy single-field columns (image_url, video_url, document_url) but an empty attachments array are backfilled: each legacy field is converted into an attachment object and appended to the attachments array.
- Only runs for rows where attachments is still empty, so admin-edited attachments are never overwritten.

3. Updated Function
- `get_material_recommendation_by_token` is recreated to also return the new `attachments` jsonb column, so the public token-based view includes all attachments alongside the legacy fields.

4. Security
- No RLS or policy changes — the function remains SECURITY DEFINER, revoked from public, granted to anon and authenticated.
- The function is dropped and recreated (DROP FUNCTION IF EXISTS + CREATE FUNCTION) to update its return signature.

5. Important Notes
- Idempotent: ADD COLUMN IF NOT EXISTS and the backfill only touches rows with empty attachments.
- Legacy columns (image_url, video_url, document_url) are kept for backward compatibility — the frontend can use either the legacy fields or the new attachments array.
*/

alter table material_recommendations
add column if not exists attachments jsonb not null default '[]'::jsonb;

update material_recommendations recommendation
set attachments = coalesce(recommendation.attachments, '[]'::jsonb)
|| case when recommendation.image_url is not null then jsonb_build_array(jsonb_build_object('kind', 'image', 'url', recommendation.image_url, 'name', 'Image')) else '[]'::jsonb end
|| case when recommendation.video_url is not null then jsonb_build_array(jsonb_build_object('kind', 'video', 'url', recommendation.video_url, 'name', 'Video')) else '[]'::jsonb end
|| case when recommendation.document_url is not null then jsonb_build_array(jsonb_build_object('kind', 'document', 'url', recommendation.document_url, 'name', 'Supporting document')) else '[]'::jsonb end
where jsonb_array_length(coalesce(recommendation.attachments, '[]'::jsonb)) = 0
and (recommendation.image_url is not null or recommendation.video_url is not null or recommendation.document_url is not null);

drop function if exists get_material_recommendation_by_token(text);

create function get_material_recommendation_by_token(share_token text)
returns table (
  id uuid,
  title text,
  description text,
  document_url text,
  image_url text,
  video_url text,
  attachments jsonb,
  category_name text,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    recommendation.id,
    recommendation.title,
    recommendation.description,
    recommendation.document_url,
    recommendation.image_url,
    recommendation.video_url,
    recommendation.attachments,
    category.name,
    share.expires_at
  from material_share_links share
  join material_recommendations recommendation on recommendation.id = share.recommendation_id
  left join material_categories category on category.id = recommendation.category_id
  where share.token = share_token
    and share.revoked_at is null
    and (share.expires_at is null or share.expires_at > now())
    and recommendation.status = 'published'
  limit 1;
$$;

revoke all on function get_material_recommendation_by_token(text) from public;
grant execute on function get_material_recommendation_by_token(text) to anon, authenticated;
