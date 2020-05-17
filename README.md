# es-dev-server-rollup

Use rollup plugins in es-dev-server.

> Warning: this project is still experimental.

## Installation

```bash
npm i --save-dev es-dev-server-rollup
```

## Usage

es-dev-server plugins and rollup plugins share a very similar API, making it possible to reuse many rollup plugins inside es-dev-server with an adapter.

Import the rollup plugin and the `wrapRollupPlugin` function in your es-dev-server config. Then, wrap the rollup plugin with the wrapper function:

```js
const replace = require('@rollup/plugin-replace');
const { wrapRollupPlugin } = require('es-dev-server-rollup');

module.exports = {
  plugins: [
    wrapRollupPlugin(
      replace({ include: ['src/**/*.js'], __environment__: '"development"' })
    ),
  ],
};
```

## Performance

Some rollup plugins do expensive operations. During development, this matters a lot more than during a production build. It's recommended to always scope the usage of plugins using the `include` and `exclude` options.

## non-standard file types

The rollup build process assumes that any imported files are are meant to be compiled to JS, es-dev-server serves many different kinds of files to the browser. If you are transforming a non-standard filetype to JS, for example .json files, you need to instruct es-dev-server to handle it as a JS file:

```js
const json = require('@rollup/plugin-json');
const { wrapRollupPlugin } = require('es-dev-server-rollup');

module.exports = {
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
```

## Compatibility with rollup plugins

Since es-dev-server doesn't do any bundling, only the following lifecycle hooks from rollup are called:

- options
- buildStart
- resolveId
- load
- transform

Plugins that use other lifecycle hooks are mostly build optimizations and are not interesting during development.

The following rollup plugins have been tested to work correctly:

- [@rollup/plugin-alias](https://github.com/rollup/plugins/tree/master/packages/alias)
- [@rollup/plugin-inject](https://github.com/rollup/plugins/tree/master/packages/inject)
- [@rollup/plugin-commonjs](https://github.com/rollup/plugins/tree/master/packages/commonjs)
- [@rollup/plugin-dsv](https://github.com/rollup/plugins/tree/master/packages/dsv)
- [@rollup/plugin-image](https://github.com/rollup/plugins/tree/master/packages/image)
- [@rollup/plugin-json](https://github.com/rollup/plugins/tree/master/packages/json)
- [@rollup/plugin-node-resolve](https://github.com/rollup/plugins/tree/master/packages/node-resolve)
- [@rollup/plugin-replace](https://github.com/rollup/plugins/tree/master/packages/replace)
- [@rollup/plugin-sucrase](https://github.com/rollup/plugins/tree/master/packages/sucrase)

The following rollup plugins don't work correctly at the moment:

- [@rollup/plugin-typescript](https://github.com/rollup/plugins/tree/master/packages/typescript) (use `@rollup/plugin-sucrase` with transform TS option)
