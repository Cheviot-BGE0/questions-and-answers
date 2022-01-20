let db;
exports.init = (dbInitialized) => {
  db = dbInitialized;
};

exports.getQuestions = async (req, res) => {
  const { product_id, page, count } = req.query;
  if (!testInt(product_id)) {
    return res.status(400).send('missing product ID');
  }
  try {
    const data = await db.getQuestions(product_id, { page, count });
    res.status(200).send(data);
  } catch (err) {
    res.status(500).send('unable to retrieve questions');
  }
};

exports.getAnswers = async (req, res) => {
  const { page, count } = req.query;
  const { question_id } = req.params;
  if (!testInt(question_id)) {
    return res.status(400).send(`invalid question id ${question_id}`);
  }
  try {
    const data = await db.getAnswers(question_id, { page, count });
    res.status(200).send(data);
  } catch (err) {
    res.status(500).send('unable to retrieve answers');
  }
};

exports.postQuestion = async (req, res) => {
  const { body, name, email, product_id } = req.body;
  if (!body || !name || !email || !testInt(product_id)) {
    return res.status(400).send('missing form data');
  }
  if (email.match(/\w+@\w+\.\w\w+/) === null) return res.status(400).send('invalid email address');
  try {
    db.addQuestion(body, name, email, product_id)
    return res.status(201).send();
  } catch (err) {
    res.status(500).send('unable to post question');
  }
};

exports.postAnswer = async (req, res) => {
  const { body, name, email, question_id, photos } = req.body;
  if (!body || !name || !email || !testInt(question_id)) {
    return res.status(400).send('missing form data');
  }
  if (photos && !Array.isArray(photos)) return res.status(400).send('invalid photos array')
  if (email.match(/\w+@\w+\.\w\w+/) === null) return res.status(400).send('invalid email address');
  try {
    db.addAnswer(body, name, email, question_id, photos)
    return res.status(201).send();
  } catch (err) {
    res.status(500).send('unable to post question');
  }
};

exports.putQuestionHelpful = async (req, res) => {
  putDB(
    req,
    res,
    req.params.question_id,
    db.markQuestionHelpful,
    'Unable to mark question helpful.'
  );
};

exports.putQuestionReport = async (req, res) => {
  putDB(req, res, req.params.question_id, db.reportQuestion, 'Unable to report question.');
};

exports.putAnswerHelpful = async (req, res) => {
  putDB(req, res, req.params.answer_id, db.markAnswerHelpful, 'Unable to mark answer helpful.');
};

exports.putAnswerReport = async (req, res) => {
  putDB(req, res, req.params.answer_id, db.reportAnswer, 'Unable to report answer.');
};

async function putDB(req, res, input_id, dbFunc, errorText) {
  if (!testInt(input_id)) {
    return res.status(400).send(`invalid question id ${input_id}`);
  }
  try {
    await dbFunc(input_id);
    res.status(204).send();
  } catch (err) {
    res.status(500).send(errorText);
  }
}

function testInt(val) {
  return (val !== undefined && Number.isInteger(parseInt(val)))
}
