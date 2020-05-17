const commonjs = require('@rollup/plugin-commonjs');
const { wrapRollupPlugin } = require('../../dist/es-dev-server-rollup');

module.exports = {
  open: 'demo/commonjs/',
  nodeResolve: true,
  plugins: [wrapRollupPlugin(commonjs())],
};
