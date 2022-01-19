const paths = require('../../server/paths.js');

describe('Server Paths', () => {
  const goodData = 'success';
  const dbStub = {};
  const resStub = {};
  beforeAll(() => {
    dbStub.init = jest.fn();
    paths.init(dbStub);
  });
  beforeEach(() => {
    resStub.send = jest.fn();
    resStub.status = jest.fn().mockReturnValue({ send: resStub.send });
  });
  describe('GET questions', () => {
    const goodReq = { query: { product_id: 1 } };
    it('should return with a status of 200', async () => {
      dbStub.getQuestions = jest.fn();
      await paths.getQuestions(goodReq, resStub);
      expect(resStub.status.mock.calls[0][0]).toBe(200);
      expect(resStub.send.mock.calls.length).toBe(1);
    });
    it('should call the DB function when provided a product ID, and return the data', async () => {
      dbStub.getQuestions = jest.fn().mockReturnValueOnce(goodData);
      await paths.getQuestions(goodReq, resStub);
      expect(dbStub.getQuestions.mock.calls.length).toBe(1);
      expect(resStub.send.mock.calls[0][0]).toBe(goodData);
    });
    it('should fail when not provided a valid request', async () => {
      dbStub.getQuestions = jest.fn().mockReturnValueOnce(goodData);
      await paths.getQuestions({ query: {} }, resStub);
      expect(dbStub.getQuestions.mock.calls.length).toBe(0);
      expect(resStub.status.mock.calls[0][0]).toBe(400);
    });
  });
  describe('GET answers', () => {
    const goodReq = { query: {}, params: { question_id: 1 } };
    it('should return with a status of 200', async () => {
      dbStub.getAnswers = jest.fn();
      await paths.getAnswers(goodReq, resStub);
      expect(resStub.status.mock.calls[0][0]).toBe(200);
      expect(resStub.send.mock.calls.length).toBe(1);
    });
    it('should call the DB function when provided a product ID, and return the data', async () => {
      dbStub.getAnswers = jest.fn().mockReturnValueOnce(goodData);
      await paths.getAnswers(goodReq, resStub);
      expect(dbStub.getAnswers.mock.calls.length).toBe(1);
      expect(resStub.send.mock.calls[0][0]).toBe(goodData);
    });
    it('should fail when not provided a valid request', async () => {
      dbStub.getAnswers = jest.fn().mockReturnValueOnce(goodData);
      await paths.getAnswers({ query: {}, params: {} }, resStub);
      expect(dbStub.getAnswers.mock.calls.length).toBe(0);
      expect(resStub.status.mock.calls[0][0]).toBe(400);
    });
  });
  describe('POST question', () => {});
  describe('POST answer', () => {});
  describe('PUT questions helpful', () => {});
  describe('PUT questions report', () => {});
  describe('PUT answers helpful', () => {});
  describe('PUT answers report', () => {});
});
