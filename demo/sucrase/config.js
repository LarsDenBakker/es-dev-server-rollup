const sucrase = require('@rollup/plugin-sucrase');
const { wrapRollupPlugin } = require('../../dist/es-dev-server-rollup');

module.exports = {
  open: 'demo/sucrase/',
  nodeResolve: true,
  plugins: [wrapRollupPlugin(sucrase({ transforms: [] }))],
};
