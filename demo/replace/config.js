const replace = require('@rollup/plugin-replace');
const { wrapRollupPlugin } = require('../../dist/es-dev-server-rollup');

module.exports = {
  open: 'demo/replace/',
  nodeResolve: true,
  plugins: [wrapRollupPlugin(replace({ __buildEnv__: '"production"' }))],
};
