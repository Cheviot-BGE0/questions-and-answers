const express = require('express');
const db = require('./postgres.js');
const paths = require('./paths.js');

const app = express();
const port = 3000;

app.use(express.json());

app.get('/questions', paths.getQuestions);

app.get('/questions/:question_id/answers', paths.getAnswers);

app.post('/questions', paths.postQuestion)

app.post('/questions/:question_id/answers', paths.postAnswer)

app.put('/questions/:question_id/helpful', paths.putQuestionHelpful)

app.put('/questions/:question_id/report', paths.putQuestionReport)

app.put('/answers/:answer_id/helpful', paths.putAnswerHelpful)

app.put('/answers/:answer_id/report', paths.putAnswerReport)

app.use(express.static('static'))

db.init().then(() => {
  paths.init(db);
  app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
});
