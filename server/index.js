const express = require('express');
const db = require('./postgres.js');
const paths = require('./paths.js');

const app = express();
const port = 3000;

app.use(express.json());

app.get('/qa/questions', paths.getQuestions);

app.get('/qa/questions/:question_id/answers', paths.getAnswers);

app.post('/qa/questions', paths.postQuestion)

app.post('/qa/questions/:question_id/answers', paths.postAnswer)

app.put('/qa/questions/:question_id/helpful', paths.putQuestionHelpful)

app.put('/qa/questions/:question_id/report', paths.putQuestionReport)

app.put('/qa/answers/:answer_id/helpful', paths.putAnswerHelpful)

app.put('/qa/answers/:answer_id/report', paths.putAnswerReport)

app.use(express.static('static'))

db.init().then(() => {
  paths.init(db);
  app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
});
