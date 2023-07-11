export default globalThis.console;

export function logId() {
  console.log('logId', browser.runtime.id);
}
