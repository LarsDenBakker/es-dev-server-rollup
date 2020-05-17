const image = require('@rollup/plugin-image');
const { wrapRollupPlugin } = require('../../dist/es-dev-server-rollup');

module.exports = {
  open: 'demo/image/',
  nodeResolve: true,
  plugins: [
    wrapRollupPlugin(image()),
  ],
};
