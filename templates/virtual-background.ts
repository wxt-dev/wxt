import definition from '{{moduleId}}';

try {
  const res = definition.main();
  if (res instanceof Promise) {
    console.warn(
      "The background's main() function return a promise, but it must be synchonous",
    );
  }
} catch (err) {
  console.error('The background script crashed on startup!');
  throw err;
}
