interface StoredDataApi {
  read(this: void): string | null;
  write(this: void, value: string | null): void;
  listen(this: void, onChange: (value: string | null) => void): () => void;
}

export function createStoredData(storage: Storage, key: string): StoredDataApi {
  return {
    read() {
      return storage.getItem(key);
    },

    write(token: string | null) {
      if (token === null) {
        storage.removeItem(key);
      } else {
        storage.setItem(key, token);
      }
    },

    listen(onChange: (value: string | null) => void) {
      const listener = (event: StorageEvent) => {
        if (event.key === key) {
          onChange(event.newValue);
        }
      };

      window.addEventListener('storage', listener);

      return () => {
        window.removeEventListener('storage', listener);
      };
    },
  };
}
