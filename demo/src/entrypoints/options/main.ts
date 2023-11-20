import 'url:https://code.jquery.com/jquery-3.7.1.slim.min.js';

console.log(browser.runtime.id);
logId();
console.log(2);

console.log('WXT MODE:', {
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
});
