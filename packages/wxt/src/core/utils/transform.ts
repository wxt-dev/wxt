import { ProxifiedModule, parseModule } from 'magicast';

/**
 * Removes any code used at runtime related to an entrypoint's main function.
 * - Removes or clears out `main` function from returned object
 * - TODO: Removes unused imports after main function has been removed to prevent importing runtime modules
 */
export function removeMainFunctionCode(code: string): {
  code: string;
  map?: string;
} {
  const mod = parseModule(code);
  emptyMainFunction(mod);
  return mod.generate();
}

function emptyMainFunction(mod: ProxifiedModule) {
  if (mod.exports?.default?.$type === 'function-call') {
    if (mod.exports.default.$ast?.arguments?.[0]?.body) {
      // Remove body from function
      // ex: "fn(() => { ... })" to "fn(() => {})"
      // ex: "fn(function () { ... })" to "fn(function () {})"
      mod.exports.default.$ast.arguments[0].body.body = [];
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
