# IndexedDB Example

IndexedDB is a common database by web extensions. It is not subject to the same storage limits as the storage APIs (`browser.storage.*`), making it ideal for storing large amounts or an unknown amount of data. It also doesn't require any permissions to use.

However, just like `localStorage`, IndexedDB is limitted to a single JS context. So generally, the background opens and accesses the database, while other JS contexts like the content scripts or UI request data from it.

This architechure is very similar to the standard request/response model used by most applications relient on a server, and you can follow many of the same design patterns when creating your background script.

In this example, we use [`idb`](https://www.npmjs.com/package/idb) and [`@webext-core/proxy-service`](https://www.npmjs.com/package/@webext-core/proxy-service) to simplify the database interactions and communication, creating a simple todo list stored inside IndexedDB.

> NOTE: The JS used to compose the UI of the extension is just one way of many to write a UI in vanilla JS.

1. Inside `utils/background-api.ts`, create the "backend" API the rest of the extension will be able to use
   1. Open the IndexedDB database
   2. Create a `TodosRepo` service to read and update the data
      > I'm using the repo directly here for the example, but it would be a good idea to put any of your extension's logic inside a service instead of the repo, and use the service for the next step.
   3. Return the repo inside the background API object so that all contexts can access the data.
2. Inside `entrypoints/popup/main.ts`, build a UI that uses `getBackgroundApi` to load, create, update, and delete todos from a UI.
