import { ProxifiedModule, parseModule } from 'magicast';

/**
 * Removes any code used at runtime related to an entrypoint's main function.
 * 1. Removes or clears out `main` function from returned object
 * 2. Removes unused imports
 * 3. Removes value-less, side-effect only imports (like `import "./styles.css"` or `import "webextension-polyfill"`)
 */
export function removeMainFunctionCode(code: string): {
  code: string;
  map?: string;
} {
  const mod = parseModule(code);
  emptyMainFunction(mod);
  removeUnusedImports(mod);
  removeSideEffectImports(mod);
  return mod.generate();
}

function emptyMainFunction(mod: ProxifiedModule): void {
  if (mod.exports?.default?.$type === 'function-call') {
    if (mod.exports.default.$ast?.arguments?.[0]?.body) {
      // Remove body from function
      // ex: "fn(() => { ... })" to "fn()"
      // ex: "fn(function () { ... })" to "fn()"
      delete mod.exports.default.$ast.arguments[0];
    } else if (mod.exports.default.$ast?.arguments?.[0]?.properties) {
      // Remove main field from object
      // ex: "fn({ ..., main: () => {} })" to "fn({ ... })"
      mod.exports.default.$ast.arguments[0].properties =
        mod.exports.default.$ast.arguments[0].properties.filter(
          (prop: any) => prop.key.name !== 'main',
        );
    }
  }
}

// TODO: Do a more complex declaration analysis where shadowed variables are detected and ignored.
// Right now, this code assumes there are no shadowed variables.
function removeUnusedImports(mod: ProxifiedModule): void {
  const importSymbols = Object.keys(mod.imports);
  const usedMap = new Map(importSymbols.map((sym) => [sym, false]));

  const queue: any[] = [getSimpleAstJson(mod.$ast)];
  for (const item of queue) {
    if (!item) {
      continue;
    } else if (Array.isArray(item)) {
      queue.push(...item);
    } else if (item.type === 'ImportDeclaration') {
      // Exclude looking for identifiers in import statements
      continue;
    } else if (item.type === 'Identifier') {
      // Only track import usages
      if (usedMap.has(item.name)) usedMap.set(item.name, true);
    } else if (typeof item === 'object') {
      queue.push(Object.values(item));
    }
  }

  for (const [name, used] of usedMap.entries()) {
    if (!used) delete mod.imports[name];
  }
}

function deleteImportAst(
  mod: ProxifiedModule,
  shouldDelete: (node: any) => boolean,
): void {
  const importIndexesToDelete: number[] = [];
  (mod.$ast as any).body.forEach((node: any, index: number) => {
    if (node.type === 'ImportDeclaration' && shouldDelete(node)) {
      importIndexesToDelete.push(index);
    }
  });
  importIndexesToDelete.reverse().forEach((i) => {
    delete (mod.$ast as any).body[i];
  });
}

function removeSideEffectImports(mod: ProxifiedModule): void {
  deleteImportAst(mod, (node) => node.specifiers.length === 0);
}

/**
 * Util to get the AST as a simple JSON object, stripping out large objects and file locations to keep it readible
 */
function getSimpleAstJson(ast: any): any {
  if (!ast) {
    return ast;
  } else if (Array.isArray(ast)) {
    return ast.map(getSimpleAstJson);
  } else if (typeof ast === 'object') {
    return Object.fromEntries(
      Object.entries(ast)
        .filter(
          ([key, value]) => key !== 'loc' && key !== 'start' && key !== 'end',
        )
        .map(([key, value]) => [key, getSimpleAstJson(value)]),
    );
  } else {
    return ast;
  }
}
