const paths = require('../../server/paths.js');

//TODO: adjust stubs such that they throw an error given certain inputs
const dbStub = {
  init: jest.fn(() => 'success'),
  getQuestions: jest.fn((product_id, { page, count }) => 'success'),
  getAnswers: jest.fn((question_id, { page, count }) => 'success'),
  addQuestion: jest.fn((body, name, email, product_id) => 'success'),
  addAnswer: jest.fn((body, name, email, photos, question_id) => 'success'),
  markQuestionHelpful: jest.fn((question_id) => 'success'),
  reportQuestion: jest.fn((question_id) => 'success'),
  markAnswerHelpful: jest.fn((answer_id) => 'success'),
  reportAnswer: jest.fn((answer_id) => 'success'),
};

describe('Server Paths', () => {
  beforeAll(() => {
    paths.init(dbStub);
  });
  beforeEach
  describe('GET questions', () => {
    it ('should call the DB function when provided a product ID', async () => {
      const req = {query: {productId: 1}}
      const res = {send: }
      expect(paths.getQuestions(req, res))
    })
  });
  describe('GET answers', () => {});
  describe('POST question', () => {});
  describe('POST answer', () => {});
  describe('PUT questions helpful', () => {});
  describe('PUT questions report', () => {});
  describe('PUT answers helpful', () => {});
  describe('PUT answers report', () => {});
});
