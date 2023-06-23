import net from 'node:net';

/**
 * Finds the first open port in a range of ports.
 */
export function findOpenPort(
  startPort: number,
  endPort: number,
): Promise<number> {
  return findOpenPortRecursive(startPort, startPort, endPort);
}

function findOpenPortRecursive(
  port: number,
  startPort: number,
  endPort: number,
): Promise<number> {
  return new Promise((resolve, reject) => {
    if (port > endPort)
      return reject(
        Error(`Could not find open port between ${startPort}-${endPort}`),
      );
    const server = net.createServer();

    server.listen(port, () => {
      server.once('close', () => resolve(port));
      server.close();
    });
    server.on('error', () =>
      resolve(findOpenPortRecursive(port + 1, startPort, endPort)),
    );
  });
}
