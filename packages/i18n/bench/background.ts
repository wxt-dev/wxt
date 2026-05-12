import { Bench } from 'tinybench';
import { createI18n } from '../src';

declare const chrome: any;

export const i18n = createI18n();

// Keep service worker alive
setTimeout(() => {
  chrome.runtime.getPlatformInfo();
}, 20e3);

(async () => {
  const results: Record<string, any> = {};
  const runBench = async (bench: Bench) => {
    await reportProgress(`[start] ${bench.name}`);
    await bench.run();
    results[bench.name!] = bench.table();
    await reportProgress(`[done]  ${bench.name}`);
  };

  {
    const key = 'simple';
    const simple = new Bench({ name: 'Simple' })
      .add('Vanilla', () => void chrome.i18n.getMessage(key))
      .add('WXT I18n', () => void i18n.t(key));
    await runBench(simple);
  }

  {
    const key = 'substitution';
    const value = 'test';
    const substitution = new Bench({ name: 'Substitution' })
      .add('Vanilla', () => void chrome.i18n.getMessage(key, [value]))
      .add('WXT I18n', () => void i18n.t(key, [value]));
    await runBench(substitution);
  }

  {
    const vanillaPluralKey = 'plural';
    const wxtKey = 'wxtPlural';
    const one = 1;
    const pluralSingular = new Bench({
      name: 'Plural (singular form)',
    })
      .add(
        'Vanilla',
        () => void chrome.i18n.getMessage(vanillaPluralKey, [one]),
      )
      .add('WXT I18n', () => void i18n.t(wxtKey, one));
    await runBench(pluralSingular);

    const two = 2;
    const vanillaSingularKey = 'singular';
    const pluralPlural = new Bench({
      name: 'Plural (plural form)',
      time: 1000,
    })
      .add(
        'Vanilla',
        () => void chrome.i18n.getMessage(vanillaSingularKey, [two]),
      )
      .add('WXT I18n', () => void i18n.t(wxtKey, two));
    await runBench(pluralPlural);
  }

  // Report results
  await reportResults(results);
})();

async function reportProgress(message: string) {
  const res = await fetch('http://localhost:3000/progress', {
    method: 'POST',
    body: message,
  });
  if (!res.ok) throw Error('Progress report failed...');
}

async function reportResults(results: any) {
  const res = await fetch('http://localhost:3000/results', {
    method: 'POST',
    body: JSON.stringify(results, null, 2),
  });
  if (!res.ok) throw Error('Results report failed...');
}
