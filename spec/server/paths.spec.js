const paths = require('../../server/paths.js');

describe('Server Paths', () => {
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

  //----------~~~~~~~~~~========== Generic test structure ==========~~~~~~~~~~----------

  const genericTest = async (
    testCommand,
    dbCommandName,
    goodReq,
    badReqs,
    goodStatus,
    goodReturn
  ) => {
    it('should return with a status of 200', async () => {
      dbStub[dbCommandName] = jest.fn();
      await testCommand(goodReq, resStub);
      expect(resStub.status.mock.calls[0][0]).toBe(goodStatus);
      expect(resStub.send.mock.calls.length).toBe(1);
    });
    let testName = 'should call the DB function when provided a valid request';
    if (goodReturn) testName += ', and return the data';
    it(testName, async () => {
      dbStub[dbCommandName] = jest.fn().mockReturnValue(goodReturn);
      await testCommand(goodReq, resStub);
      expect(dbStub[dbCommandName].mock.calls.length).toBe(1);
      if (goodReturn) expect(resStub.send.mock.calls[0][0]).toBe(goodReturn);
    });
    for (const [badElement, badReq] of badReqs) {
      it(`should reject requests with ${badElement}`, async () => {
        dbStub[dbCommandName] = jest.fn();
        await testCommand(badReq, resStub);
        expect(dbStub[dbCommandName].mock.calls.length).toBe(0);
        expect(resStub.status.mock.calls[0][0]).toBe(400);
      });
    }
    it('should handle database errors gracefully', async () => {
      dbStub[dbCommandName] = () => {
        throw new Error('uh oh!');
      };
      await testCommand(goodReq, resStub);
      expect(resStub.status.mock.calls[0][0]).toBe(500);
    });
  };

  //----------~~~~~~~~~~========== Actual tests ==========~~~~~~~~~~----------

  describe('GET questions', () => {
    const goodReq = { query: { product_id: 1 } };
    const badReqs = [
      ['a missing product id', { query: {} }],
      ['an invalid product id', { query: { product_id: 'shirt' } }],
    ];
    genericTest(paths.getQuestions, 'getQuestions', goodReq, badReqs, 200, 'success');
  });
  describe('GET answers', () => {
    const goodReq = { query: {}, params: { question_id: 1 } };
    const badReqs = [
      ['a missing question id', { query: {}, params: {} }],
      ['an invalid question id', { query: {}, params: { question_id: '???' } }],
    ];
    genericTest(paths.getAnswers, 'getAnswers', goodReq, badReqs, 200, 'success');
  });
  describe('POST question', () => {
    const goodReq = { query: {}, params: {}, body: {} };
    const badReqs = [] //TODO: fill out post question bad requests list (lots)
    genericTest(paths.postQuestion, 'addQuestion', goodReq, badReqs, 201);
  });
  describe('POST answer', () => {
    const goodReq = { query: {}, params: {}, body: {} };
    const badReqs = [] //TODO: fill out post answer bad requests list (lots)
    genericTest(paths.postAnswer, 'addAnswer', goodReq, badReqs, 201);
  });
  describe('PUT questions helpful', () => {
    const goodReq = { params: { question_id: 1 } };
    const badReqs = [
      ['a missing question id', { params: {} }],
      ['an invalid question id', { params: { question_id: '???' } }],
    ];
    genericTest(paths.putQuestionHelpful, 'markQuestionHelpful', goodReq, badReqs, 204);
  });
  describe('PUT questions report', () => {
    const goodReq = { params: { question_id: 1 } };
    const badReqs = [
      ['a missing question id', { params: {} }],
      ['an invalid question id', { params: { question_id: '???' } }],
    ];
    genericTest(paths.putQuestionReport, 'reportQuestion', goodReq, badReqs, 204);
  });
  describe('PUT answers helpful', () => {
    const goodReq = { params: { answer_id: 1 } };
    const badReqs = [
      ['a missing answer id', { params: {} }],
      ['an invalid answer id', { params: { answer_id: '!!!' } }],
    ];
    genericTest(paths.putAnswerHelpful, 'markAnswerHelpful', goodReq, badReqs, 204);
  });
  describe('PUT answers report', () => {
    const goodReq = { params: { answer_id: 1 } };
    const badReqs = [
      ['a missing answer id', { params: {} }],
      ['an invalid answer id', { params: { answer_id: '!!!' } }],
    ];
    genericTest(paths.putAnswerReport, 'reportAnswer', goodReq, badReqs, 204);
  });
});
