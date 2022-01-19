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
  const testGET = async (testCommand, dbCommandName, goodReq) => {
    it('should return with a status of 200', async () => {
      dbStub[dbCommandName] = jest.fn().mockReturnValue(goodData);
      await testCommand(goodReq, resStub);
      expect(resStub.status.mock.calls[0][0]).toBe(200);
      expect(resStub.send.mock.calls.length).toBe(1);
    });
    it('should call the DB function when provided a product ID, and return the data', async () => {
      dbStub[dbCommandName] = jest.fn().mockReturnValue(goodData);
      await testCommand(goodReq, resStub);
      expect(dbStub[dbCommandName].mock.calls.length).toBe(1);
      expect(resStub.send.mock.calls[0][0]).toBe(goodData);
    });
    it('should fail when not provided a valid request', async () => {
      dbStub[dbCommandName] = jest.fn().mockReturnValue(goodData);
      await testCommand({ query: {}, params: {} }, resStub);
      expect(dbStub[dbCommandName].mock.calls.length).toBe(0);
      expect(resStub.status.mock.calls[0][0]).toBe(400);
    });
  }
  describe('GET questions', () => {
    const goodReq = { query: { product_id: 1 } };
    testGET(paths.getQuestions, 'getQuestions', goodReq)
  });
  describe('GET answers', () => {
    const goodReq = { query: {}, params: { question_id: 1 } };
    testGET(paths.getAnswers, 'getAnswers', goodReq)
  });
  describe('POST question', () => {});
  describe('POST answer', () => {});
  describe('PUT questions helpful', () => {});
  describe('PUT questions report', () => {});
  describe('PUT answers helpful', () => {});
  describe('PUT answers report', () => {});

});
