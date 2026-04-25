// The `MAIN` world script cannot use `browser.runtime.id`, but the uniqueness
// of the event name is not an issue as the event is only dispatched on a
// specific `script` element which is detached from the document.
const SCRIPT_RESULT_EVENT_NAME = 'wxt:script-result';

/**
 * Dispatch a `CustomEvent` for a successful script result which carries a
 * result value.
 */
export function dispatchScriptSuccessEvent(
  target: EventTarget,
  value: unknown,
): boolean {
  return dispatchScriptResultEvent(target, scriptSuccess(value));
}

/**
 * Dispatch a `CustomEvent` for a failed script result which carries an `Error`
 * value.
 */
export function dispatchScriptErrorEvent(
  target: EventTarget,
  error: Error,
): boolean {
  return dispatchScriptResultEvent(target, scriptError(error));
}

function dispatchScriptResultEvent(
  target: EventTarget,
  result: ScriptResult,
): boolean {
  return target.dispatchEvent(
    new CustomEvent(SCRIPT_RESULT_EVENT_NAME, { detail: result }),
  );
}

/**
 * Add a one-time event listener for a script result `CustomEvent`, and return a
 * `Promise` which either resolves with the result value or rejects with an
 * error depending on whether the result is successful or not.
 */
export function waitForScriptResultEvent(
  target: EventTarget,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    target.addEventListener(
      SCRIPT_RESULT_EVENT_NAME,
      (event) => {
        try {
          resolve(parseScriptResultEvent(event));
        } catch (err) {
          reject(err);
        }
      },
      { once: true },
    );
  });
}

function parseScriptResultEvent(event: Event): unknown {
  if (!(event instanceof CustomEvent)) {
    throw new Error(
      `Expected a \`CustomEvent\`, got: \`${event.constructor.name}\``,
    );
  }

  return parseScriptResult(event.detail as unknown);
}

type ScriptResult =
  | { type: 'success'; value: unknown }
  | { type: 'error'; error: Error };

function scriptSuccess(value: unknown): ScriptResult {
  return { type: 'success', value };
}

function scriptError(error: Error): ScriptResult {
  return { type: 'error', error: deconstructError(error) };
}

function parseScriptResult(result: unknown): unknown {
  if (!isScriptResult(result)) {
    throw new Error(
      `Expected a \`ScriptResult\`, got: ${JSON.stringify(result)}`,
    );
  }

  switch (result.type) {
    case 'success':
      return result.value;
    case 'error':
      throw reconstructError(result.error);
    default:
      throw new Error(
        `Impossible \`ScriptResult\`: ${JSON.stringify(result satisfies never)}`,
      );
  }
}

function isScriptResult(result: unknown): result is ScriptResult {
  return (
    result != null &&
    typeof result === 'object' &&
    'type' in result &&
    typeof result.type === 'string' &&
    ((result.type === 'success' && 'value' in result) ||
      (result.type === 'error' &&
        'error' in result &&
        isDeconstructedError(result.error)))
  );
}

/**
 * A representation of an `Error` which can be transmitted within a
 * `CustomEvent`.
 */
type DeconstructedError = {
  name: string;
  message: string;
  stack?: string;
};

function deconstructError(error: Error): DeconstructedError {
  const result: DeconstructedError = {
    name: error.name,
    message: error.message,
  };

  if ('stack' in error) result.stack = error.stack;

  return result;
}

function reconstructError(deconstructedError: DeconstructedError): Error {
  const error = new Error(deconstructedError.message);
  error.name = deconstructedError.name;

  if ('stack' in deconstructedError) {
    error.stack = deconstructedError.stack;
  } else {
    delete error.stack;
  }

  return error;
}

function isDeconstructedError(value: unknown): value is DeconstructedError {
  return (
    value != null &&
    typeof value === 'object' &&
    'name' in value &&
    value.name != null &&
    typeof value.name === 'string' &&
    'message' in value &&
    value.message != null &&
    typeof value.message === 'string' &&
    (!('stack' in value) ||
      (value.stack != null && typeof value.stack === 'string'))
  );
}
