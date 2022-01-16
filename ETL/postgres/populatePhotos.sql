with cte_photos as (
  select answer_id, jsonb_agg(js_object) result
    from (
      select
        answer_id,
        jsonb_build_object (
          'id', id,
          'url', url
        ) js_object
        from answers_photos
    ) p
    group by answer_id
)
update answers a
set photos = cte_photos.result
from cte_photos
where a.id = cte_photos.answer_id;

create sequence if not exists photo_id_seq;
select setval('photo_id_seq', (select max(id) from answers_photos) + 1);

drop table answers_photos;
