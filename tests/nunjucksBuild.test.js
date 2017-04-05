/* eslint-disable no-undef */
const staticComponentBrowser = require('../index.js');


test('Default index is collected into component browser through a dry run', () => {
  const options = {
    output: './built',
    context: 'src/templates',
    globs: [
      './src/templates/*.html',
    ],
    nunjucksOptions: {
      path: '../src/templates',
    },
    baseTemplate: 'src/templates/_base.html',
    dryRun: true,
  };

  return staticComponentBrowser(options).then(result => {
    expect(result.length).toBeGreaterThan(0);
  });
});
