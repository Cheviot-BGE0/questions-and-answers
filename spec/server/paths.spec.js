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
  describe('GET questions', () => {});
  describe('GET answers', () => {});
  describe('POST question', () => {});
  describe('POST answer', () => {});
  describe('PUT questions helpful', () => {});
  describe('PUT questions report', () => {});
  describe('PUT answers helpful', () => {});
  describe('PUT answers report', () => {});
});
