export default console;

export function logId() {
  console.log('logId', browser.runtime.id);
}

export function logEnv() {
  const { EXAMPLE } = useAppConfig();
  console.log(EXAMPLE);
}
