const express = require('express');
const db = require('./postgres.js');

const app = express();
const port = 3000;

app.use(express.json());

app.get('/questions', async function (req, res) {
  const { product_id, page, count } = req.query;
  if (product_id === undefined) {
    return res.status(400).send('missing product ID');
  }
  try {
    const data = await db.getQuestions(product_id, { page, count });
    res.send(data);
  } catch (err) {
    res.status(500).send('unable to retrieve questions');
    throw err;
  }
});

app.get('/questions/:question_id/answers', async function (req, res) {
  const { page, count } = req.query;
  const { question_id } = req.params;
  if (question_id === undefined || !Number.isInteger(parseInt(question_id))) {
    return res.status(400).send(`invalid question id ${question_id}`)
  }
  try {
    const data = await db.getAnswers(question_id, { page, count })
    res.send(data)
  } catch(err) {
    res.status(500).send('unable to retrieve answers')
    throw err;
  }
});

app.post('/questions', async function (req, res) {
  res.status(500).send('not yet implemented')
})

app.post('/questions/:question_id/answers', async function (req, res) {
  res.status(500).send('not yet implemented')
})

app.put('/questions/:question_id/helpful', (req, res) => {
  postDB(req, res, req.params.question_id, db.markQuestionHelpful, 'Unable to mark question helpful.')
})

app.put('/questions/:question_id/report', (req, res) => {
  postDB(req, res, req.params.question_id, db.reportQuestion, 'Unable to report question.')
})

app.put('/answers/:answer_id/helpful', (req, res) => {
  postDB(req, res, req.params.answer_id, db.markAnswerHelpful, 'Unable to mark answer helpful.')
})

app.put('/answers/:answer_id/report', (req, res) => {
  postDB(req, res, req.params.answer_id, db.reportAnswer, 'Unable to report answer.')
})

db.init().then(() => {
  app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
});

async function postDB(req, res, input_id, dbFunc, errorText) {
  if (input_id === undefined || !Number.isInteger(parseInt(input_id))) {
    return res.status(400).send(`invalid question id ${input_id}`)
  }
  try {
    await dbFunc(input_id)
    res.status(204).send()
  } catch (err) {
    res.status(500).send(errorText)
    throw err;
  }
}
