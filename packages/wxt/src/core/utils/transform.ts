import { parseModule } from 'magicast';

export function removeMainFunctionCode(code: string): {
  code: string;
  map?: string;
} {
  const mod = parseModule(code);
  if (mod.exports.default.$type === 'function-call') {
    console.log(mod.exports.default.$ast?.arguments?.[0]?.properties);
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
  return mod.generate();
}
