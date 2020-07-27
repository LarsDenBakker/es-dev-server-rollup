import path from 'path';
import whatwgUrl from 'whatwg-url';
import {
  Plugin as EdsPlugin,
  ParsedConfig,
  virtualFilePrefix,
} from 'es-dev-server';
import { URL, pathToFileURL, fileURLToPath } from 'url';
import { Plugin as RollupPlugin, TransformPluginContext } from 'rollup';
import {
  getTextContent,
  setTextContent,
  // @ts-ignore
} from '@open-wc/building-utils/dom5-fork';
// @ts-ignore
import { findJsScripts } from '@open-wc/building-utils';
import { parse as parseHtml, serialize as serializeHtml } from 'parse5';
import { InputOptions } from 'rollup';
import { toBrowserPath } from './utils';
import { createPluginContext } from './PluginContext';
import { FSWatcher } from 'chokidar';

const NULL_BYTE_PARAM = 'es-dev-server-rollup-null-byte';

function resolveFilePath(rootDir: string, path: string) {
  const fileUrl = new URL(`.${path}`, `${pathToFileURL(rootDir)}/`);
  return fileURLToPath(fileUrl);
}

export function wrapRollupPlugin(
  rollupPlugin: RollupPlugin,
  rollupOptions: Partial<InputOptions> = {}
): EdsPlugin {
  const transformedFiles = new Set();
  let transformedOptions: InputOptions;
  let fileWatcher: FSWatcher;
  let config: ParsedConfig;
  let rootDir: string;

  const edsPlugin: EdsPlugin = {
    serverStart(args) {
      ({ fileWatcher, config } = args);
      ({ rootDir } = config);
      const rollupPluginContext = createPluginContext(
        fileWatcher,
        config,
        edsPlugin
      );

      // call the options and buildStart hooks
      transformedOptions =
        rollupPlugin.options?.call(rollupPluginContext, rollupOptions) ??
        rollupOptions;
      rollupPlugin.buildStart?.call(rollupPluginContext, transformedOptions);
    },

    async resolveImport({ source, context }) {
      // if we just transformed this file and the import is an absolute file path
      // we need to rewrite it to a browser path
      const injectedFilePath =
        transformedFiles.has(context.path) && source.startsWith(rootDir);

      if (!injectedFilePath && !rollupPlugin.resolveId) {
        return;
      }

      if (! path.isAbsolute(source) && whatwgUrl.parseURL(source) != null) {
        // don't resolve relative and valid urls 
        return source;
      }

      const requestedFile = context.path.endsWith('/')
        ? `${context.path}index.html`
        : context.path;
      const filePath = resolveFilePath(rootDir, requestedFile);

      const rollupPluginContext = createPluginContext(
        fileWatcher,
        config,
        edsPlugin,
        context
      );

      // if the import was already a fully resolved file path, it was probably injected by a plugin.
      // in that case use that instead of resolving it through a plugin hook. this puts the resolved file
      // path through the regular logic to turn it into a relative browser import
      // otherwise call the resolveID hook on the plugin
      const result = injectedFilePath
        ? source
        : await rollupPlugin.resolveId?.call(
            rollupPluginContext,
            source,
            filePath
          );

      let resolvedImportFilePath: string | undefined = undefined;
      if (typeof result === 'string') {
        resolvedImportFilePath = result;
      } else if (typeof result === 'object' && typeof result?.id === 'string') {
        resolvedImportFilePath = result.id;
      }

      if (!resolvedImportFilePath) {
        return undefined;
      }

      const hasNullByte = resolvedImportFilePath.includes('\0');
      const withoutNullByte = hasNullByte
        ? resolvedImportFilePath.replace(new RegExp('\0', 'g'), '')
        : resolvedImportFilePath;

      if (withoutNullByte.startsWith(rootDir)) {
        const resolveRelativeTo = path.extname(filePath)
          ? path.dirname(filePath)
          : filePath;
        const relativeImportFilePath = path.relative(
          resolveRelativeTo,
          withoutNullByte
        );
        const resolvedImportPath = `${toBrowserPath(relativeImportFilePath)}`;

        const prefixedImportPath =
          resolvedImportPath.startsWith('/') ||
          resolvedImportPath.startsWith('.')
            ? resolvedImportPath
            : `./${resolvedImportPath}`;

        if (!hasNullByte) {
          return prefixedImportPath;
        } else {
          const suffix = `${NULL_BYTE_PARAM}=${encodeURIComponent(
            resolvedImportFilePath
          )}`;
          if (prefixedImportPath.includes('?')) {
            return `${prefixedImportPath}&${suffix}`;
          }
          return `${prefixedImportPath}?${suffix}`;
        }
      }

      // if the resolved import includes a null byte (\0) there is some special logic
      // these often are not valid file paths, so the browser cannot request them.
      // we rewrite them to a special URL which we deconstruct later when we load the file
      if (resolvedImportFilePath.includes('\0')) {
        return `${virtualFilePrefix}?${NULL_BYTE_PARAM}=${encodeURIComponent(
          resolvedImportFilePath
        )}`;
      }

      return resolvedImportFilePath;
    },

    async serve(context) {
      if (!rollupPlugin.load) {
        return;
      }

      let filePath;
      if (context.URL.searchParams.has(NULL_BYTE_PARAM)) {
        // if this was a special URL constructed in resolveImport to handle null bytes,
        // the file path is stored in the search paramter
        filePath = context.URL.searchParams.get(NULL_BYTE_PARAM) as string;
      } else {
        filePath = resolveFilePath(rootDir, context.path);
      }

      const rollupPluginContext = createPluginContext(
        fileWatcher,
        config,
        edsPlugin,
        context
      );

      const result = await rollupPlugin.load?.call(
        rollupPluginContext,
        filePath
      );

      if (typeof result === 'string') {
        return { body: result, type: 'js' };
      }
      if (typeof result?.code === 'string') {
        return { body: result.code, type: 'js' };
      }

      return undefined;
    },

    async transform(context) {
      if (!rollupPlugin.transform) {
        return;
      }

      if (context.response.is('js')) {
        const filePath = resolveFilePath(rootDir, context.path);
        const rollupPluginContext = createPluginContext(
          fileWatcher,
          config,
          edsPlugin,
          context
        );
        const result = await rollupPlugin.transform?.call(
          rollupPluginContext as TransformPluginContext,
          context.body,
          filePath
        );

        let transformedCode: string | undefined = undefined;
        if (typeof result === 'string') {
          transformedCode = result;
        }

        if (typeof result === 'object' && typeof result?.code === 'string') {
          transformedCode = result.code;
        }

        if (transformedCode) {
          transformedFiles.add(context.path);
          return { body: transformedCode };
        }

        return;
      }

      if (context.response.is('html')) {
        const requestedFile = context.path.endsWith('/')
          ? `${context.path}index.html`
          : context.path;
        const filePath = resolveFilePath(rootDir, requestedFile);
        let changed = false;

        const documentAst = parseHtml(context.body);
        const scriptNodes = findJsScripts(documentAst, {
          jsScripts: true,
          jsModules: true,
          inlineJsScripts: true,
        });

        for (const node of scriptNodes) {
          const code = getTextContent(node);
          const rollupPluginContext = createPluginContext(
            fileWatcher,
            config,
            edsPlugin,
            context
          );
          const result = await rollupPlugin.transform?.call(
            rollupPluginContext as TransformPluginContext,
            code,
            filePath
          );

          let transformedCode;
          if (typeof result === 'string') {
            transformedCode = result;
          } else if (
            typeof result === 'object' &&
            typeof result?.code === 'string'
          ) {
            transformedCode = result.code;
          }

          if (transformedCode) {
            changed = true;
            setTextContent(node, transformedCode);
          }
        }

        if (changed) {
          transformedFiles.add(context.path);
          return { body: serializeHtml(documentAst) };
        }
      }
    },
  };

  return edsPlugin;
}
