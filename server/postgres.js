const { Client } = require('pg');
const { database, user, password } = require('./config.js');

const client = new Client({ database, user, password });
function init() {
  return client.connect();
}

const questionsQueryOld = `
select jsonb_agg(js_object) results
from (
  select
    jsonb_build_object (
      'id', id,
      'product_id', product_id,
      'date_written', date_written,
      'body', body,
      'asker_name', asker_name,
      'helpful', helpful,
      'reported', reported,
      'answers', jsonb_agg(answers_ob)
    ) js_object
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
  ) temp
`;

const questionsQuery = `
select jsonb_agg(js_object) results
from (
  select
    jsonb_build_object (
      'id', id,
      'product_id', product_id,
      'date_written', date_written,
      'body', body,
      'asker_name', asker_name,
      'helpful', helpful,
      'reported', reported,
      'answers', jsonb_agg(answers_ob)
    ) js_object
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
        'photos', photos
      ) answers_ob
      from questions q
      join answers a on q.id = a.question_id
      where q.product_id = $1
      order by q.id, a.id
    ) temp
    group by id, product_id, date_written, body, asker_name, helpful, reported
  ) temp
`;
//TODO: exclude reported results
//TODO: figure out how to make query return empty array for objects with no contents (answers, and answers_photos)
//TODO: join questions should probably be an outer join, to preserve questions with no answers (unless the fact that missing answers returns an array with one object with null on all values, makes an inner join a de facto outer join)

//TODO: maybe just store photos as a json object? After initial creation there's no editing of the photos array, so I could lose that whole table

//alternately, just trim empty objects after the query

//parameters
async function getQuestions(product_id, { page, count }) {
  const questions = await client.query(questionsQuery, [product_id]);

  const response = {
    product_id,
    results: questions.rows[0].results,
  };
  return response;
}

const answersQueryOld = `
select jsonb_agg(js_object) results
from (
  select
      jsonb_build_object (
        'id', id,
        'question_id', question_id,
        'body', body,
        'date_written', date_written,
        'answerer_name', answerer_name,
        'answerer_email', answerer_email,
        'helpful', helpful,
        'reported', reported,
        'photos', photos
      ) js_object
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
  ) temp
`;

const answersQuery = 'select * from answers where question_id = $1';

//query, parameters
async function getAnswers(question_id, { page, count }) {
  const answers = await client.query(answersQuery, [question_id]);

  const response = {
    question_id,
    results: answers.rows[0].results,
  };
  return response;
}

const addQuestionString = `
  insert into questions
    (product_id, date_written, body, asker_name, asker_email, helpful, reported)
    values ($1, $2, $3, $4, $5, 0, 0)`;

async function addQuestion(body, name, email, product_id) {
  await client.query(addQuestionString, [product_id, new Date(), body, name, email]);
}

const addAnswerString = `
  insert into answers
    (question_id, body, date_written, answerer_name, answerer_email, helpful, reported, photos)
    values ($1, $2, $3, $4, $5, 0, 0, $6)
`;

async function addAnswer(question_id, body, name, email, photos) {
  //TODO: test if await map works
  //TODO: maybe we can get the select nextval down to one query for an arbitrary number of photos
  photos = await photos.map(async function (photo) {
    const nextId = await client.query(`select nextval('photo_id_seq')`);
    return { url: photo.url, id: nextId };
  });
  await client.query(addAnswerString, [
    question_id,
    body,
    new Date(),
    name,
    email,
    JSON.stringify(photos),
  ]);
}

async function markQuestionHelpful(question_id) {}

async function reportQuestion(question_id) {}

async function markAnswerHelpful(answer_id) {}

async function reportAnswer(answer_id) {}

module.exports = {
  init,
  getQuestions,
  getAnswers,
  addQuestion,
  addAnswer,
  markQuestionHelpful,
  reportQuestion,
  markAnswerHelpful,
  reportAnswer,
};
