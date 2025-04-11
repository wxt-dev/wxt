export function openWebSocket(url: string): Promise<WebSocket> {
  return new Promise<WebSocket>((resolve, reject) => {
    const webSocket = new WebSocket(url);

    const cleanup = () => {
      webSocket.removeEventListener('open', onOpen);
      webSocket.removeEventListener('error', onError);
      webSocket.removeEventListener('close', onClose);
    };
    const onOpen = async () => {
      cleanup();
      resolve(webSocket);
    };
    const onClose = (event: CloseEvent) => {
      cleanup();
      reject(
        new Error(
          `Connection closed: code=${event.code}, reason=${event.reason}`,
        ),
      );
    };
    const onError = (error: any) => {
      cleanup();
      reject(new Error('Error connecting to WebSocket', { cause: error }));
    };

    webSocket.addEventListener('open', onOpen);
    webSocket.addEventListener('error', onError);
    webSocket.addEventListener('close', onClose);
  });
}
