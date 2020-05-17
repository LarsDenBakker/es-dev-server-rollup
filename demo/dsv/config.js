const dsv = require('@rollup/plugin-dsv');
const { wrapRollupPlugin } = require('../../dist/es-dev-server-rollup');

module.exports = {
  open: 'demo/dsv/',
  nodeResolve: true,
  plugins: [
    {
      resolveMimeType(context) {
        if (context.path.endsWith('.csv')) {
          return 'js';
        }
      },
    },
    wrapRollupPlugin(dsv()),
  ],
};
