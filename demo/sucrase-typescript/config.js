const sucrase = require('@rollup/plugin-sucrase');
const { wrapRollupPlugin } = require('../../dist/es-dev-server-rollup');

module.exports = {
  open: 'demo/sucrase-typescript/',
  nodeResolve: true,
  plugins: [
    {
      resolveMimeType(context) {
        if (context.path.endsWith('.ts')) {
          return 'js';
        }
      },
    },
    wrapRollupPlugin(sucrase({ transforms: ['typescript'] })),
  ],
};
