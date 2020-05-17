const nodeResolve = require('@rollup/plugin-node-resolve');
const { wrapRollupPlugin } = require('../../dist/es-dev-server-rollup');

module.exports = {
  open: 'demo/node-resolve/',
  plugins: [wrapRollupPlugin(nodeResolve())],
};
