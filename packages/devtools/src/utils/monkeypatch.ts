export function monkeypatchConsole() {
  const ogConsole = { ...console };

  function reportLog(level: string, args: any[]) {
    // TODO
  }

  console.debug = (...args: any) => {
    reportLog('debug', args);
    return ogConsole.debug(...args);
  };
  console.log = (...args: any) => {
    reportLog('log', args);
    return ogConsole.log(...args);
  };
  console.info = (...args: any) => {
    reportLog('info', args);
    return ogConsole.info(...args);
  };
  console.warn = (...args: any) => {
    reportLog('warn', args);
    return ogConsole.warn(...args);
  };
  console.error = (...args: any) => {
    reportLog('error', args);
    return ogConsole.error(...args);
  };
}
