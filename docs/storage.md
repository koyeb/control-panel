# Storage

Browser storage is managed through a `StoredValue<T>` abstraction defined in `src/application/storage.ts`. The app uses `localStorage` for persistent preferences and `sessionStorage` for ephemeral state. No cookies or IndexedDB are used.

## `StoredValue<T>`

A typed wrapper around `Storage.getItem` / `setItem` with serialization and reactivity:

```ts
const storedTheme = new StoredValue('koyeb.theme', {
  parse: (value) => (isThemeMode(value) ? value : 'system'),
  stringify: String,
});

storedTheme.read(); // T | null
storedTheme.write('dark'); // serializes and stores
storedTheme.write(null); // calls removeItem
```

It defaults to `localStorage` with `JSON.parse` / `JSON.stringify`, but both the storage backend and serialization can be overridden per instance:

```ts
new StoredValue('shellInitialCommand', {
  storage: window.sessionStorage,
  parse: String,
  stringify: String,
});
```

## Reactivity

`StoredValue` supports a `listen` method that subscribes to changes from both the same tab (via an internal `EventTarget` emitter) and other tabs (via the native `window.storage` event). This is designed for use with `useSyncExternalStore`:

```ts
const projectId = useSyncExternalStore(storedProjectId.listen, storedProjectId.read);
```

## Early theme read

`index.html` reads `koyeb.theme` from `localStorage` in a blocking `<script>` to apply the theme class before React mounts, preventing a flash of incorrect styling.
