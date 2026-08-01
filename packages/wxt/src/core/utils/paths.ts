import systemPath from 'node:path';

const SLASH = 47; // /
const BACKSLASH = 92; // \
const DOT = 46; // .
const QUESTION = 63; // ?

function normalize(path: string): string {
  if (typeof path !== 'string') {
    throw new TypeError('expected path to be a string');
  }

  const len = path.length;
  if (path === '\\' || path === '/') return '/';
  if (len <= 1) return path;

  // Fast path: already POSIX, no `//`, no trailing `/`
  if (
    path.charCodeAt(len - 1) !== SLASH &&
    path.indexOf('\\') === -1 &&
    path.indexOf('//') === -1
  ) {
    return path;
  }

  let input = path;
  let prefix = '';
  if (
    len > 4 &&
    input.charCodeAt(0) === BACKSLASH &&
    input.charCodeAt(1) === BACKSLASH &&
    (input.charCodeAt(2) === QUESTION || input.charCodeAt(2) === DOT) &&
    input.charCodeAt(3) === BACKSLASH
  ) {
    // \\?\ / \\.\ → keep as //?/ //./
    prefix = '//';
    input = input.slice(2);
  }

  const parts: string[] = [];
  let segStart = -1;
  const n = input.length;

  for (let i = 0; i <= n; i++) {
    const code = i < n ? input.charCodeAt(i) : SLASH; // end sentinel
    const isSep = code === SLASH || code === BACKSLASH;

    if (isSep) {
      if (segStart !== -1) {
        parts.push(input.slice(segStart, i));
        segStart = -1;
      } else if (i === 0) {
        // Absolute path: leading separator → empty first segment
        parts.push('');
      }
      // skip consecutive separators
    } else if (segStart === -1) {
      segStart = i;
    }
  }

  // stripTrailing (default true): drop empty last segment from trailing sep
  if (parts.length > 1 && parts[parts.length - 1] === '') {
    parts.pop();
  }

  return prefix + parts.join('/');
}

/**
 * Converts system paths to normalized bundler path. On Windows, this returns
 * paths with `/` instead of `\`.
 */
export function normalizePath(path: string): string {
  return normalize(path);
}

/**
 * Given a normalized path, convert it to the system path style. On Windows,
 * switch to , otherwise use /.
 */
export function unnormalizePath(path: string): string {
  return systemPath.normalize(path);
}

export const CSS_EXTENSIONS = ['css', 'scss', 'sass', 'less', 'styl', 'stylus'];

// .module.css files are not supported because these are global CSS files, so using CSS modules doesn't make sense.
export const CSS_EXTENSIONS_PATTERN = `+(${CSS_EXTENSIONS.join('|')})`;
