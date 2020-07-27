import * as acorn from 'acorn';
import path from 'path';
import { Context } from 'koa';
import { FSWatcher } from 'chokidar';
import { Plugin as EdsPlugin } from 'es-dev-server';
import { VERSION as rollupVersion } from 'rollup';
// @ts-ignore
import injectClassFields from 'acorn-class-fields';
// @ts-ignore
import injectImportMeta from 'acorn-import-meta';
// @ts-ignore
import injectStaticClassFeatures from 'acorn-static-class-features';
import { ParsedConfig } from 'es-dev-server';

const acornOptions: acorn.Options = {
  ecmaVersion: 2020,
  preserveParens: false,
  sourceType: 'module',
  allowAwaitOutsideFunction: true,
};
const acornParser = acorn.Parser.extend(
  injectImportMeta,
  injectClassFields,
  injectStaticClassFeatures
);

export function createPluginContext(
  fileWatcher: FSWatcher,
  config: ParsedConfig,
  plugin: EdsPlugin,
  context?: Context
): any {
  return {
    meta: { rollupVersion },
    addWatchFile(id: string) {
      const filePath = path.join(process.cwd(), id);
      fileWatcher.add(filePath);
    },
    emitAsset() {},
    emitChunk() {},
    emitFile() {},
    error(err: Error) {
      throw err;
    },
    getAssetFileName() {},
    getChunkFileName() {},
    getFileName() {},
    getModuleIds: () => [],
    getModuleInfo(id: string) {
      return {
        dynamicallyImportedIds: [],
        dynamicImporters: [],
        hasModuleSideEffects: false,
        id,
        importedIds: [],
        importers: [],
        isEntry: false,
        isExternal: false,
      };
    },
    isExternal() {},
    get moduleIds() {
      return [];
    },
    parse(code: string, options: acorn.Options) {
      return acornParser.parse(code, {
        ...acornOptions,
        ...options,
      });
    },
    async resolve(
      source: string,
      importer: string,
      options: { skipSelf: boolean }
    ) {
      if (!context) throw new Error('Context is required.');

      for (const pl of config.plugins) {
        if (
          pl.resolveImport &&
          (!options.skipSelf || pl.resolveImport !== plugin.resolveImport)
        ) {
          const result = await pl.resolveImport({ source, context });
          if (result) {
            return { id: path.resolve(importer, result) };
          }
        }
      }
    },
    resolveId(
      source: string,
      importer: string,
      options: { skipSelf: boolean }
    ) {
      return this.resolve(
        source,
        importer,
        options
      ).then((r?: { id: string }) => (r ? r.id : r));
    },
    setAssetSource() {},
    warn(warning: any) {
      console.warn(warning);
    },
  };
}
