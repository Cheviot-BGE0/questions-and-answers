const paths = require('../../server/paths.js');

const success = () => 'success';
const dbStub = {
  init: success,
  getQuestions: success,
  getAnswers: success,
  addQuestion: success,
  addAnswer: success,
  markQuestionHelpful: success,
  reportQuestion: success,
  markAnswerHelpful: success,
  reportAnswer: success,
};

describe('Server Paths', () => {
  beforeAll(() => {
    paths.init(dbStub);
  });
  describe('GET questions', async () => {});
  describe('GET answers', async () => {});
  describe('POST question', async () => {});
  describe('POST answer', async () => {});
  describe('PUT questions helpful', async () => {});
  describe('PUT questions report', async () => {});
  describe('PUT answers helpful', async () => {});
  describe('PUT answers report', async () => {});
});
