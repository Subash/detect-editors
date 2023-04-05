const detectEditors = require('../');

test('Test getAvailableEditors()', async () => {
  await detectEditors.getAvailableEditors();
});
