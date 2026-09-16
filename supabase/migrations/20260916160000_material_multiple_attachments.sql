/* Allow any number of images, videos, and documents per material guide. */

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
