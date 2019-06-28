const detectEditors = require('../');

test('Test getAvailableEditors()', (done)=> {
  expect.assertions(3);
  detectEditors
    .getAvailableEditors()
    .then((editors)=> {
      expect(editors.length).toBeGreaterThan(0);
      expect(editors[0]).toHaveProperty('editor');
      expect(editors[0]).toHaveProperty('path');
      done();
    });
});
