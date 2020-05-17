import nodeResolve from '@rollup/plugin-node-resolve';
import { setupServer, fetchText, expectIncludes } from './helpers';
import { wrapRollupPlugin } from '../src/es-dev-server-rollup';

describe('@rollup/plugin-node-resolve', () => {
  let server;
  beforeEach(async () => {
    server = await setupServer({
      plugins: [wrapRollupPlugin(nodeResolve())],
    });
  });

  afterEach(() => {
    server.close();
  });

  it('can resolve imports', async () => {
    const text = await fetchText('app.js');
    expectIncludes(text, "import moduleA from './node_modules/module-a/index.js'");
  });
});
