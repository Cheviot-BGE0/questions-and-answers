const { Client } = require('pg');
const { database, user, password } = require('./config.js');

const client = new Client({ database, user, password });
function init () {
  return client.connect();
}

const questionQuery = `
select jsonb_agg(js_object) result
from
  (
    select
      jsonb_build_object(
        'id', id,
        'product_id', product_id,
        'date_written', date_written,
        'body', body,
        'asker_name', asker_name,
        'helpful', helpful,
        'reported', reported,
        'answers', jsonb_agg(answers)
      ) js_object
    from (
      select
        q.*,
        jsonb_build_object(
          'id', a.id,
          'question_id', a.question_id,
          'body', a.body,
          'date_written', a.date_written,
          'answerer_name', answerer_name,
          'answerer_email', answerer_email,
          'helpful', a.helpful,
          'reported', a.reported
        ) answers
        from questions q
        join answers a on q.id = a.question_id
        where q.id = $1
    ) a
    group by id, product_id, date_written, body, asker_name, helpful, reported, answers
  ) a
`

//parameters
async function getQuestions (product_id, {page, count}) {
  const questions = await client.query(questionQuery, [product_id]);

  const response = {
    product_id,
    results: questions.rows[0].result
  }
  return response;
}

//query, parameters
async function getAnswers (question_id, { page, count}) {

}

async function addQuestion (body, name, email, product_id) {

}

async function addAnswer (question_id, body, name, email, photos) {

}

async function markQuestionHelpful (question_id) {

}

async function reportQuestion (question_id) {

}

async function markAnswerHelpful (answer_id) {

}

async function reportAnswer (answer_id) {

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
}
