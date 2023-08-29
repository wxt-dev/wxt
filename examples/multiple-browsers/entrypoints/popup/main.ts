const browserName = document.querySelector<HTMLHeadingElement>('#browserName')!;
const isChrome = document.querySelector<HTMLParagraphElement>('#isChrome')!;
const isFirefox = document.querySelector<HTMLParagraphElement>('#isFirefox')!;
const isSafari = document.querySelector<HTMLParagraphElement>('#isSafari')!;
const isEdge = document.querySelector<HTMLParagraphElement>('#isEdge')!;
const isOpera = document.querySelector<HTMLParagraphElement>('#isOpera')!;
const isCustom = document.querySelector<HTMLParagraphElement>('#isCustom')!;

browserName.textContent = __BROWSER__;
isChrome.textContent = String(__IS_CHROME__);
isFirefox.textContent = String(__IS_FIREFOX__);
isSafari.textContent = String(__IS_SAFARI__);
isEdge.textContent = String(__IS_EDGE__);
isOpera.textContent = String(__IS_OPERA__);
isCustom.textContent = String(__BROWSER__ === 'custom');
