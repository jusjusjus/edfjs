
const path = require('path');

module.exports = {
  entry: './web/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, '..', 'web'),
  },
};
