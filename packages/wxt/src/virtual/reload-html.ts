if (import.meta.hot) {
  import.meta.hot.on('wxt:reload-page', (event) => {
    // "popup.html" === "/popup.html".substring(1)
    if (event.detail === location.pathname.substring(1)) location.reload();
  });
}
