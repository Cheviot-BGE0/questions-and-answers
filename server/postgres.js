const { Client } = require('pg');
const { database, user, password } = require('../config.js');

const client = new Client({ database, user, password });
function init() {
  return client.connect();
}

const questionsQuery = `
select id, product_id, date_written, body, asker_name, helpful, reported, jsonb_agg(answers_ob) answers from (
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
    left join answers a on q.id = a.question_id
    where q.product_id = $1 and q.reported = 0 and a.reported = 0
    order by q.id, a.id
  ) temp
  group by id, product_id, date_written, body, asker_email, asker_name, helpful, reported
`;
//TODO: exclude reported results
//TODO: figure out how to make query return empty array for objects with no contents (answers, and answers_photos)
//alternately, just trim empty objects after the query
//TODO: join questions should probably be an outer join, to preserve questions with no answers (unless the fact that missing answers returns an array with one object with null on all values, makes an inner join a de facto outer join)

//parameters
async function getQuestions(product_id, { page, count }) {
  //TODO: selectable order, page, count
  const questions = await client.query(questionsQuery, [product_id]);
  //TODO: photos is null when no photos. Return empty array instead? Rebuild data with empty array when no photos?
  const response = {
    product_id,
    results: questions.rows,
  };
  return response;
}


const answersQuery = 'select * from answers where question_id = $1 and reported = 0 order by id';

//query, parameters
async function getAnswers(question_id, { page, count }) {
  //TODO: selectable order, page, count
  const answers = await client.query(answersQuery, [question_id]);

  const response = {
    question_id,
    results: answers.rows,
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

async function markQuestionHelpful(question_id) {
  await client.query('UPDATE questions SET helpful = qNew.helpful + 1 from (select helpful from questions where id = $1) qNew where id = $1', [question_id])
}

async function reportQuestion(question_id) {
  await client.query('UPDATE questions SET reported = 1 where id = $1', [question_id])
}

async function markAnswerHelpful(answer_id) {
  await client.query('UPDATE answers SET helpful = aNew.helpful + 1 from (select helpful from answers where id = $1) aNew where id = $1', [answer_id])}

async function reportAnswer(answer_id) {
  await client.query('UPDATE answers SET reported = 1 where id = $1', [answer_id])
}

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
