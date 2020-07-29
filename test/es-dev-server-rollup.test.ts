import nodeResolve from '@rollup/plugin-node-resolve';
import { Plugin as RollupPlugin } from 'rollup';
import { expect } from 'chai';
import path from 'path';
import { setupServer, fetchText, expectIncludes } from './helpers';
import { wrapRollupPlugin } from '../src/es-dev-server-rollup';
import { Node } from 'acorn';

describe.only('es-dev-server-rollup', () => {
  describe('resolveId', () => {
    it('can resolve imports, returning a string', async () => {
      const plugin: RollupPlugin = {
        name: 'my-plugin',
        resolveId(id) {
          return `RESOLVED_${id}`;
        },
      };
      const server = await setupServer({
        plugins: [wrapRollupPlugin(plugin)],
      });

      try {
        const text = await fetchText('app.js');
        expectIncludes(text, "import moduleA from 'RESOLVED_module-a'");
      } finally {
        server.close();
      }
    });

    it('can resolve imports, returning an object', async () => {
      const plugin: RollupPlugin = {
        name: 'my-plugin',
        resolveId(id) {
          return { id: `RESOLVED_${id}` };
        },
      };
      const server = await setupServer({
        plugins: [wrapRollupPlugin(plugin)],
      });

      try {
        const text = await fetchText('app.js');
        expectIncludes(text, "import moduleA from 'RESOLVED_module-a'");
      } finally {
        server.close();
      }
    });

    it('can resolve imports in inline scripts', async () => {
      const plugin: RollupPlugin = {
        name: 'my-plugin',
        resolveId(id) {
          return { id: `RESOLVED_${id}` };
        },
      };
      const server = await setupServer({
        plugins: [wrapRollupPlugin(plugin)],
      });

      try {
        const text = await fetchText('index.html');
        expectIncludes(text, "import 'RESOLVED_module-a'");
      } finally {
        server.close();
      }
    });

    it('a resolved file path is resolved relative to the importing file', async () => {
      const plugin: RollupPlugin = {
        name: 'my-plugin',
        resolveId(id) {
          return path.join(__dirname, 'fixture', 'src', 'foo.js');
        },
      };
      const server = await setupServer({
        plugins: [wrapRollupPlugin(plugin)],
      });

      try {
        const text = await fetchText('app.js');
        expectIncludes(text, "import moduleA from './src/foo.js'");
      } finally {
        server.close();
      }
    });

    it('can resolve imports with plugins that use the `resolve` helper', async () => {
      const file = '../../hello.js';
      const plugin: RollupPlugin = {
        name: 'my-plugin',
        async resolveId(id, importer) {
          if(id === file) return id;
          return await this.resolve(file, importer, { skipSelf: false });
        },
      };
      const server = await setupServer({
        plugins: [wrapRollupPlugin(plugin)],
      });

      try {
        const text = await fetchText('app.js');
        expectIncludes(text, `import moduleA from '${path.resolve('hello.js')}'`);
      } finally {
        server.close();
      }
    });
  });

  describe('load', () => {
    it('can serve files', async () => {
      const plugin: RollupPlugin = {
        name: 'my-plugin',
        load(id) {
          if (id === path.join(__dirname, 'fixture', 'src', 'foo.js')) {
            return 'console.log("hello world")';
          }
        },
      };
      const server = await setupServer({
        plugins: [wrapRollupPlugin(plugin)],
      });

      try {
        const text = await fetchText('src/foo.js');
        expectIncludes(text, 'console.log("hello world")');
      } finally {
        server.close();
      }
    });

    it('can return an object', async () => {
      const plugin: RollupPlugin = {
        name: 'my-plugin',
        load(id) {
          if (id === path.join(__dirname, 'fixture', 'src', 'foo.js')) {
            return { code: 'console.log("hello world")' };
          }
        },
      };
      const server = await setupServer({
        plugins: [wrapRollupPlugin(plugin)],
      });

      try {
        const text = await fetchText('src/foo.js');
        expectIncludes(text, 'console.log("hello world")');
      } finally {
        server.close();
      }
    });
  });

  describe('transform', () => {
    it('can return a string', async () => {
      const plugin: RollupPlugin = {
        name: 'my-plugin',
        transform(code, id) {
          if (id === path.join(__dirname, 'fixture', 'app.js')) {
            return `${code}\nconsole.log("transformed");`;
          }
        },
      };
      const server = await setupServer({
        plugins: [wrapRollupPlugin(plugin)],
      });

      try {
        const text = await fetchText('app.js');
        expectIncludes(text, 'console.log("transformed");');
      } finally {
        server.close();
      }
    });

    it('can return an object', async () => {
      const plugin: RollupPlugin = {
        name: 'my-plugin',
        transform(code, id) {
          if (id === path.join(__dirname, 'fixture', 'app.js')) {
            return { code: `${code}\nconsole.log("transformed");` };
          }
        },
      };
      const server = await setupServer({
        plugins: [wrapRollupPlugin(plugin)],
      });

      try {
        const text = await fetchText('app.js');
        expectIncludes(text, 'console.log("transformed");');
      } finally {
        server.close();
      }
    });

    it('works on inline scripts', async () => {
      const plugin: RollupPlugin = {
        name: 'my-plugin',
        transform(code, id) {
          if (id === path.join(__dirname, 'fixture', 'index.html')) {
            return { code: `${code}\nconsole.log("transformed");` };
          }
        },
      };
      const server = await setupServer({
        plugins: [wrapRollupPlugin(plugin)],
      });

      try {
        const text = await fetchText('index.html');
        expectIncludes(text, 'console.log("transformed");');
      } finally {
        server.close();
      }
    });
  });

  it('rollup plugins can use this.parse', async () => {
    let parsed;
    const plugin: RollupPlugin = {
      name: 'my-plugin',
      transform(code, id) {
        if (id === path.join(__dirname, 'fixture', 'app.js')) {
          parsed = this.parse(code, {});
          return undefined;
        }
      },
    };
    const server = await setupServer({
      plugins: [wrapRollupPlugin(plugin)],
    });

    try {
      await fetchText('app.js');
      expect(parsed).to.be.an.instanceOf(Node);
    } finally {
      server.close();
    }
  });

  it('rewrites injected imports with file paths to browser paths', async () => {
    const plugin: RollupPlugin = {
      name: 'my-plugin',
      transform(code, id) {
        if (id === path.join(__dirname, 'fixture', 'app.js')) {
          return `import "${path.join(
            __dirname,
            'fixtures',
            'foo.js'
          )}";\n${code}`;
        }
      },
    };
    const server = await setupServer({
      plugins: [wrapRollupPlugin(plugin)],
    });

    try {
      const text = await fetchText('app.js');
      expectIncludes(text, 'import "../fixtures/foo.js"');
    } finally {
      server.close();
    }
  });

  it('imports with a null byte are rewritten to a special URL', async () => {
    const plugin: RollupPlugin = {
      name: 'my-plugin',
      load(id) {
        if (id === path.join(__dirname, 'fixture', 'app.js')) {
          return 'import "\0foo.js";';
        }
      },
      resolveId(id) {
        if (id === '\0foo.js') {
          return id;
        }
      },
    };
    const server = await setupServer({
      plugins: [wrapRollupPlugin(plugin)],
    });

    try {
      const text = await fetchText('app.js');
      expectIncludes(
        text,
        'import "/__es-dev-server__/?es-dev-server-rollup-null-byte=%00foo.js"'
      );
    } finally {
      server.close();
    }
  });

  it('requests with a null byte are receives by the rollup plugin without special prefix', async () => {
    const plugin: RollupPlugin = {
      name: 'my-plugin',
      load(id) {
        if (id === '\0foo.js') {
          return 'console.log("foo");';
        }
      },
    };
    const server = await setupServer({
      plugins: [wrapRollupPlugin(plugin)],
    });

    try {
      const text = await fetchText('__es-dev-server__/?es-dev-server-rollup-null-byte=%00foo.js');
      expectIncludes(
        text,
        'console.log("foo");'
      );
    } finally {
      server.close();
    }
  });
});
