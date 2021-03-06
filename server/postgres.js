// const { host, database, user, password } = require('../config.js');
const { Client } = require('pg');

const client = new Client({
  host:process.env.HOST,
  database: process.env.DATABASE,
  user: process.env.USER,
  password: process.env.PASSWORD });
function init() {
  return client.connect();
}

const questionsQuery = `
select id question_id, date_written question_date, body question_body, asker_name, helpful question_helpfulness, reported, coalesce(jsonb_agg(answers_ob) filter (where question_id is not null), '[]'::jsonb) answers from (
  select
    q.*,
    question_id,
    jsonb_build_object (
      'id', a.id,
      'body', a.body,
      'date', a.date_written,
      'answerer_name', answerer_name,
      'helpfulness', a.helpful,
      'photos', photos
    ) answers_ob
    from questions q
    left join answers a on q.id = a.question_id and a.reported = 0
    where q.product_id = $1 and q.reported = 0
    order by q.id, a.id
  ) temp
  group by id, product_id, date_written, body, asker_email, asker_name, helpful, reported
`;

function paginate(array, page, count) {
  if (!page || !count) return array;
  return array.slice(page * count - 1, page * count - 1 + count)
}

//parameters
async function getQuestions(product_id, { page, count }) {
  //TODO: selectable order, page, count
  const questions = await client.query(questionsQuery, [product_id]);
  const response = {
    product_id,
    results: questions.rows,
  };
  return paginate(response, page, count);
}

const answersQuery =
  'select id answer_id, body, date_written date, answerer_name, helpful helpfulness, photos from answers where question_id = $1 and reported = 0 order by id';

//query, parameters
async function getAnswers(question_id, { page, count }) {
  //TODO: selectable order, page, count
  const answers = await client.query(answersQuery, [question_id]);

  const response = {
    question_id,
    results: answers.rows,
  };
  return paginate(response, page, count);
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

async function addAnswer(body, name, email, question_id, photos) {
  if (photos && photos.length > 0) {
    const photoIds = await client.query(
      'select ' + photos.map(() => `nextval('photo_id_seq')`).join(', ')
    );
    photos = JSON.stringify(
      photos.map((photo, i) => {
        return { url: photo.url, id: photoIds[i] };
      })
    );
  } else {
    photos = '[]'
  }
  await client.query(addAnswerString, [question_id, body, new Date(), name, email, photos]);
}

async function markQuestionHelpful(question_id) {
  await client.query(
    'UPDATE questions SET helpful = qNew.helpful + 1 from (select helpful from questions where id = $1) qNew where id = $1',
    [question_id]
  );
}

async function reportQuestion(question_id) {
  await client.query('UPDATE questions SET reported = 1 where id = $1', [question_id]);
}

async function markAnswerHelpful(answer_id) {
  await client.query(
    'UPDATE answers SET helpful = aNew.helpful + 1 from (select helpful from answers where id = $1) aNew where id = $1',
    [answer_id]
  );
}

async function reportAnswer(answer_id) {
  await client.query('UPDATE answers SET reported = 1 where id = $1', [answer_id]);
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
