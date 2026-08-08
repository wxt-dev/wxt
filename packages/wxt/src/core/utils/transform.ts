import { parseSync } from 'oxc-parser';
import { transformSync } from 'oxc-transform';

/** Any node from OXC's ESTree AST. All nodes include `start`/`end` offsets. */
interface AstNode {
  type: string;
  start: number;
  end: number;
  [key: string]: any;
}

/** A range of the original source code to delete. */
interface Removal {
  start: number;
  end: number;
}

const DEFAULT_FILENAME = 'entrypoint.ts';
const MAX_PASSES = 10;

/**
 * Removes any code used at runtime related to an entrypoint's main function.
 *
 * 1. Removes or clears out `main` function from returned object
 * 2. Removes any unused functions/variables outside the definition that aren't
 *    being called/used
 * 3. Removes unused imports
 * 4. Removes value-less, side-effect only imports (like `import "./styles.css"` or
 *    `import "polyfill"`)
 *
 * @param code The entrypoint's source code.
 * @param filename Used to detect the language (JS/JSX/TS/TSX) of `code`.
 */
export function removeMainFunctionCode(
  code: string,
  filename = DEFAULT_FILENAME,
): {
  code: string;
  map?: string;
} {
  let result = removeMainFunction(code, filename);

  // Removing the main function can make imports/variables/functions unused,
  // and removing those can make even more code unused, so keep going until
  // nothing else can be removed.
  for (let i = 0; i < MAX_PASSES; i++) {
    const next = removeUnusedCode(result, filename);
    if (next === result) break;
    result = next;
  }

  // Deleting source ranges leaves behind odd whitespace, so reprint the file
  // with OXC. This also strips any TS syntax left over from removed types.
  const transformed = transformSync(filename, result, { jsx: 'preserve' });
  assertNoErrors(transformed.errors, filename);
  return { code: transformed.code.trim() };
}

function parse(code: string, filename: string) {
  const result = parseSync(filename, code);
  assertNoErrors(result.errors, filename);
  return result.program as unknown as AstNode;
}

function assertNoErrors(
  errors: Array<{ severity: string; message: string }>,
  filename: string,
): void {
  const error = errors.find((error) => error.severity === 'Error');
  if (error)
    throw Error(`Failed to remove main function from ${filename}`, {
      cause: Error(error.message),
    });
}

/**
 * Deletes the `main` function from the entrypoint's default export:
 *
 * - `export default fn(() => { ... })` becomes `export default fn()`
 * - `export default fn({ ..., main: () => {} })` becomes `export default fn({ ...
 *   })`
 */
function removeMainFunction(code: string, filename: string): string {
  const program = parse(code, filename);
  const defaultExport = program.body.find(
    (node: AstNode) => node.type === 'ExportDefaultDeclaration',
  );
  const call = defaultExport?.declaration;
  if (call?.type !== 'CallExpression') return code;

  const arg = call.arguments[0];
  if (
    arg?.type === 'ArrowFunctionExpression' ||
    arg?.type === 'FunctionExpression'
  ) {
    // Remove the function passed to the definition
    return applyRemovals(code, [getListItemRemoval(code, call.arguments, 0)]);
  }

  if (arg?.type === 'ObjectExpression') {
    // Remove the `main` field from the options passed to the definition
    const index = arg.properties.findIndex(
      (prop: AstNode) =>
        prop.type === 'Property' && getKeyName(prop) === 'main',
    );
    if (index >= 0)
      return applyRemovals(code, [
        getListItemRemoval(code, arg.properties, index),
      ]);
  }

  return code;
}

/**
 * Performs a single pass removing all top-level variables, functions, and
 * imports that aren't referenced anywhere else in the file. Also removes
 * value-less, side-effect only imports.
 */
function removeUnusedCode(code: string, filename: string): string {
  const program = parse(code, filename);
  const used = findUsedIdentifiers(program);
  const isUnused = (node: AstNode | undefined) =>
    node?.type === 'Identifier' && !used.has(node.name);

  const removals: Removal[] = [];
  for (const statement of program.body as AstNode[]) {
    switch (statement.type) {
      case 'VariableDeclaration': {
        const unused = statement.declarations.filter((declarator: AstNode) =>
          getBoundIdentifiers(declarator.id).every(isUnused),
        );
        if (unused.length === statement.declarations.length) {
          removals.push({ start: statement.start, end: statement.end });
        } else {
          for (const declarator of unused) {
            removals.push(
              getListItemRemoval(
                code,
                statement.declarations,
                statement.declarations.indexOf(declarator),
              ),
            );
          }
        }
        break;
      }

      case 'FunctionDeclaration':
      case 'ClassDeclaration': {
        if (isUnused(statement.id)) {
          removals.push({ start: statement.start, end: statement.end });
        }
        break;
      }

      case 'ImportDeclaration': {
        const unused = statement.specifiers.filter((specifier: AstNode) =>
          isUnused(specifier.local),
        );
        // Also removes value-less, side-effect only imports, which never have
        // any specifiers.
        if (unused.length === statement.specifiers.length) {
          removals.push({ start: statement.start, end: statement.end });
        } else {
          for (const specifier of unused) {
            removals.push(
              getListItemRemoval(
                code,
                statement.specifiers,
                statement.specifiers.indexOf(specifier),
              ),
            );
          }
        }
        break;
      }
    }
  }

  return applyRemovals(code, removals);
}

/**
 * Returns every identifier bound by a binding pattern, like the left-hand side
 * of a variable declarator.
 */
function getBoundIdentifiers(pattern: AstNode | undefined): AstNode[] {
  switch (pattern?.type) {
    case 'Identifier':
      return [pattern];
    case 'ArrayPattern':
      return pattern.elements.flatMap(getBoundIdentifiers);
    case 'ObjectPattern':
      return pattern.properties.flatMap((prop: AstNode) =>
        getBoundIdentifiers(prop.type === 'Property' ? prop.value : prop),
      );
    case 'AssignmentPattern':
      return getBoundIdentifiers(pattern.left);
    case 'RestElement':
      return getBoundIdentifiers(pattern.argument);
    default:
      return [];
  }
}

function getKeyName(property: AstNode): string | undefined {
  if (property.computed) return undefined;
  if (property.key?.type === 'Identifier') return property.key.name;
  if (property.key?.type === 'Literal') return String(property.key.value);
}

// TODO: Do a more complex declaration analysis where shadowed variables are detected and ignored.
// Right now, this code assumes there are no shadowed variables.
function findUsedIdentifiers(program: AstNode): Set<string> {
  const used = new Set<string>();
  const queue: any[] = [program];
  for (const item of queue) {
    if (!item || typeof item !== 'object') {
      continue;
    } else if (Array.isArray(item)) {
      queue.push(...item);
    } else if (item.type === 'ImportDeclaration') {
      // Don't look inside imports, identifiers are only used for declaration
      continue;
    } else if (item.type === 'Identifier') {
      used.add(item.name);
    } else {
      // Skip the parts of a node that declare a name instead of using one
      const skip = SKIPPED_KEYS[item.type];
      for (const [key, value] of Object.entries(item)) {
        if (skip?.includes(key)) continue;
        if (item.computed !== true && key === 'key') continue;
        queue.push(value);
      }
    }
  }
  return used;
}

const SKIPPED_KEYS: Record<string, string[]> = {
  // Ignore the declaration's name
  FunctionDeclaration: ['id'],
  ClassDeclaration: ['id'],
  VariableDeclarator: ['id'],
};

/**
 * Returns the range to delete for an item inside a comma-separated list
 * (arguments, object properties, variable declarators, import specifiers),
 * including the comma that separates it from the rest of the list.
 */
function getListItemRemoval(
  code: string,
  items: AstNode[],
  index: number,
): Removal {
  const item = items[index];
  let start = item.start;
  let end = item.end;

  let after = end;
  while (after < code.length && /\s/.test(code[after])) after++;
  if (code[after] === ',') {
    end = after + 1;
  } else {
    // Last item in the list, remove the comma before it instead - trailing
    // commas aren't allowed everywhere (ex: variable declarations).
    let before = start - 1;
    while (before >= 0 && /\s/.test(code[before])) before--;
    if (code[before] === ',') start = before;
  }

  return { start, end };
}

/** Delete each range from the code. Ranges must not overlap. */
function applyRemovals(code: string, removals: Removal[]): string {
  if (removals.length === 0) return code;

  let result = '';
  let cursor = 0;
  for (const { start, end } of removals.sort((l, r) => l.start - r.start)) {
    if (start < cursor) continue;
    result += code.slice(cursor, start);
    cursor = end;
  }
  return result + code.slice(cursor);
}
