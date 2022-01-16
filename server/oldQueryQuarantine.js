
//json object construction queries for three-table version of data
//may need fixing after removing extranous jsonb_Agg
const questionsQuery = `
select id, product_id, date_written, body, asker_name, helpful, reported, jsonb_agg(answers_ob) answers
  from (
    select
      q.*,
      jsonb_build_object (
        'id', a.id,
        'question_id', a.question_id,
        'body', a.body,
        'date_written', a.date_written,
        'answerer_name', answerer_name,
        'answerer_email', answerer_email,
        'helpful', a.helpful,
        'reported', a.reported,
        'photos', jsonb_agg(photos_ob)
      ) answers_ob
      from (
        select
          a.*,
          jsonb_build_object (
            'id', p.id,
            'url', p.url
          ) photos_ob
             from answers a
          left join answers_photos p on a.id = p.answer_id
      ) a
      join questions q on q.id = a.question_id
      where q.product_id = $1
      group by q.id, q.product_id, q.date_written, q.body, q.asker_name, q.helpful, q.reported, a.id, a.question_id, a.body, a.date_written, a.answerer_name, a.answerer_email, a.helpful, a.reported
      order by q.id, a.id
    ) temp
    group by id, product_id, date_written, body, asker_name, helpful, reported
`;

const answersQuery = `
select id, question_id, body, date_written, answerer_name, answerer_email, helpful, reported, jsonb_agg(js_object) photos
from (
  select
    a.*,
    jsonb_build_object(
      'id', p.id,
      'url', p.url
    ) photos_ob
    from answers a
    left join answers_photos p on a.id = p.answer_id
    where a.question_id = $1
) temp
group by id, question_id, body, date_written, answerer_name, answerer_email, helpful, reported
`;