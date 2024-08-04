import defu from 'defu';
import { isBackground } from 'wxt/util';
import { browser, Runtime } from 'wxt/browser';

//* Turns every function into a promise
type Asyncify<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => infer R
    ? (...args: Parameters<T[K]>) => Promise<R>
    : T[K];
};

//* I need a generic that removes class properties that are not functions
type RemoveNonFunctionProperties<T> = Pick<
  T,
  {
    [K in keyof T]: T[K] extends Function ? K : never;
  }[keyof T]
>;

interface MessagingServiceOptions<ClassInstance extends object> {
  /**
   * Must be a unique string. Used to identify the service when communicating internally.
   */
  name: string;
  /**
   * If true, name will be used as the application name in the manifest.
   * @default false
   */
  native?: boolean;
  /**
   * A function that returns an instance of the class that will be used to communicate with the background script.
   */
  instanceFunction: () => ClassInstance;
  /**
   * Wether to use ports or messages.
   * @default true
   */
  usePorts?: boolean;
}

export function defineMessagingService<ClassInstance extends object = object>(
  options: MessagingServiceOptions<ClassInstance>,
) {
  const promisesToResolve = new Map<
    string,
    { resolve: (value: any) => void; reject: (reason?: any) => void }
  >();

  const { name, native, instanceFunction, usePorts } = defu<
    MessagingServiceOptions<ClassInstance>,
    Omit<MessagingServiceOptions<ClassInstance>, 'name' | 'instanceFunction'>[]
  >(options, {
    native: false,
    usePorts: true,
  });

  if (typeof name !== 'string') throw new Error('name must be a string');
  if (typeof instanceFunction !== 'function')
    throw new Error('instanceFunction must be a function');

  //* Only set if we are in the background
  let originalInstance: ClassInstance | undefined;

  let tabPort: Runtime.Port | undefined;

  if (isBackground()) {
    originalInstance = instanceFunction();

    if (usePorts) {
      browser.runtime.onConnect.addListener(
        portListener<ClassInstance>(name, originalInstance),
      );
      browser.runtime.onUserScriptConnect.addListener(
        portListener<ClassInstance>(name, originalInstance),
      );
    }
  } else {
    tabPort = browser.runtime.connect({ name });

    //* Reconnect if the connection is closed
    tabPort.onDisconnect.addListener(() => {
      //TODO Add a delay?
      tabPort = browser.runtime.connect({ name });
    });

    tabPort.onMessage.addListener((message) => {
      if (message.n) {
        const promise = promisesToResolve.get(message.n);
        if (promise) {
          if (message.e) {
            promise.reject(message.e);
          } else {
            promise.resolve(message.d);
          }
          promisesToResolve.delete(message.n);
        }
      }
    });
  }

  let instanceProxy = new Proxy(
    {},
    {
      get(target, prop, receiver) {
        return async (...args: any[]) => {
          if (!tabPort) throw new Error('Messaging service not connected');

          return new Promise((resolve, reject) => {
            const nonce = Math.random().toString(36).slice(2);
            promisesToResolve.set(nonce, { resolve, reject });
            tabPort!.postMessage({
              f: prop,
              a: args,
              n: nonce,
            });
          });
        };
      },
    },
  );

  function registerService(): ClassInstance {
    return originalInstance!;
  }

  return [
    registerService,
    (originalInstance ?? instanceProxy) as Asyncify<
      RemoveNonFunctionProperties<ClassInstance>
    >,
  ] as const;
}

function portListener<ClassInstance extends object>(
  name: string,
  originalInstance: ClassInstance,
) {
  return (port: Runtime.Port) => {
    if (port.name !== name) return;

    port.onMessage.addListener((message) => {
      if (!('n' in message) || !('f' in message) || !('a' in message)) return;

      const func = originalInstance![message.f as keyof ClassInstance];
      if (typeof func !== 'function')
        throw new Error(`Function ${message.f} does not exist on instance`);

      try {
        const result = func.apply(originalInstance, message.a);
        if (result instanceof Promise) {
          result
            .then((value) => {
              port.postMessage({
                n: message.n,
                d: value,
              });
            })
            .catch((error) => {
              port.postMessage({
                n: message.n,
                e: error,
              });
            });
        } else {
          port.postMessage({
            n: message.n,
            d: result,
          });
        }
      } catch (error) {
        port.postMessage({
          n: message.n,
          e: error,
        });
      }
    });
  };
}
