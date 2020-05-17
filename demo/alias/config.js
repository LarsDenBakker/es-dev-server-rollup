const path = require('path');
const alias = require('@rollup/plugin-alias');
const { wrapRollupPlugin } = require('../../dist/es-dev-server-rollup');

module.exports = {
  open: 'demo/alias/',
  nodeResolve: true,
  plugins: [
    wrapRollupPlugin(
      alias({
        entries: {
          'lit-html': './lit-html-stub.js'
        },
      })
    ),
  ],
};
