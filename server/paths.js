let db;
exports.init = (dbInitialized) => {
  db = dbInitialized;
}

exports.getQuestions = async (req, res) => {
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
};

exports.getAnswers = async (req, res) => {
  const { page, count } = req.query;
  const { question_id } = req.params;
  if (question_id === undefined || !Number.isInteger(parseInt(question_id))) {
    return res.status(400).send(`invalid question id ${question_id}`);
  }
  try {
    const data = await db.getAnswers(question_id, { page, count });
    res.send(data);
  } catch (err) {
    res.status(500).send('unable to retrieve answers');
    throw err;
  }
};

exports.postQuestion = async (req, res) => {
  const { body, name, email, product_id } = req.body;
  if (!body || !name || !email || !product_id) {
    return res.status(400).send('missing form data');
  }
  if (email.match(/\w+@\w+\.\w\w+/) === null) return res.status(400).send('invalid email address');
  return res.status(202).send(202);
};

exports.postAnswer = async (req, res) => {
  res.status(500).send('not yet implemented');
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
  if (input_id === undefined || !Number.isInteger(parseInt(input_id))) {
    return res.status(400).send(`invalid question id ${input_id}`);
  }
  try {
    await dbFunc(input_id);
    res.status(204).send();
  } catch (err) {
    res.status(500).send(errorText);
    throw err;
  }
}
