import { useMemo } from 'react';

type UseStorageOptions<T> = {
  storage: Storage;
  parse: (value: string) => T;
  stringify: (value: T) => string;
};

type UseStorageReturn<T> = {
  read: () => T | null;
  write: (value: T | null) => void;
  listen: (onChange: (value: T | null) => void) => () => void;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const defaultOptions: UseStorageOptions<any> = {
  storage: window.localStorage,
  parse: JSON.parse,
  stringify: JSON.stringify,
};

export function useStorage<T>(key: string, opts?: Partial<UseStorageOptions<T>>): UseStorageReturn<T> {
  const { storage, parse, stringify }: UseStorageOptions<T> = { ...defaultOptions, ...opts };

  return useMemo<UseStorageReturn<T>>(
    () => ({
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
    }),
    [key, storage, parse, stringify],
  );
}
