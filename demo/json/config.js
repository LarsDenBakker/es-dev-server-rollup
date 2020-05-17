const json = require('@rollup/plugin-json');
const { wrapRollupPlugin } = require('../../dist/es-dev-server-rollup');

module.exports = {
  open: 'demo/json/',
  nodeResolve: true,
  plugins: [
    {
      resolveMimeType(context) {
        if (context.path.endsWith('.json')) {
          return 'js';
        }
      },
    },
    wrapRollupPlugin(json()),
  ],
};
