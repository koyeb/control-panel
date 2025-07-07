type StorageOptions<T> = {
  storage: Storage;
  parse: (value: string) => T;
  stringify: (value: T) => string;
};

type StorageReturn<T> = {
  read: () => T | null;
  write: (value: T | null) => void;
  listen: (onChange: (value: T | null) => void) => () => void;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const defaultOptions: StorageOptions<any> = {
  storage: window.localStorage,
  parse: JSON.parse,
  stringify: JSON.stringify,
};

export function createStorage<T>(key: string, opts?: Partial<StorageOptions<T>>): StorageReturn<T> {
  const { storage, parse, stringify }: StorageOptions<T> = { ...defaultOptions, ...opts };

  return {
    read: () => {
      const value = storage.getItem(key);

      if (value === null) {
        return null;
      }

      return parse(value);
    },

    write: (value: T | null) => {
      if (value === null) {
        storage.removeItem(key);
      } else {
        storage.setItem(key, stringify(value));
      }
    },

    listen: (onChange: (value: T | null) => void) => {
      const listener = (event: StorageEvent) => {
        if (event.key === key) {
          onChange(event.newValue === null ? null : parse(event.newValue));
        }
      };

      window.addEventListener('storage', listener);

      return () => {
        window.removeEventListener('storage', listener);
      };
    },
  };
}
