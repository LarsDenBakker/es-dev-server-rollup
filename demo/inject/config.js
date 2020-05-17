const path = require('path');
const inject = require('@rollup/plugin-inject');
const { wrapRollupPlugin } = require('../../dist/es-dev-server-rollup');

module.exports = {
  open: 'demo/inject/',
  nodeResolve: true,
  plugins: [
    wrapRollupPlugin(
      inject({
        html: ['lit-html', 'html'],
        SomeGlobal: [
          path.resolve(__dirname, 'injected-module.js'),
          'SomeGlobal',
        ],
      })
    ),
  ],
};
