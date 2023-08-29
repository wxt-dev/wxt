const openOptions = document.querySelector<HTMLAnchorElement>('#openOptions')!;

openOptions.href = browser.runtime.getURL('/options.html');
