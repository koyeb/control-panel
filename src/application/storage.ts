type Parse<T> = (value: string) => T;
type Serialize<T> = (value: T) => string;

type StoredValueOptions<T> = {
  storage?: Storage;
  parse?: Parse<T>;
  stringify?: Serialize<T>;
};

type ChangeListener<T> = (value: T | null) => void;

type StoredValue<T> = {
  read: () => T | null;
  write: (value: T | null) => void;
  listen: (onChange: ChangeListener<T>) => () => void;
};

export interface StoragePort {
  value<T>(key: string, options?: StoredValueOptions<T>): StoredValue<T>;
}

export class BrowserStorageAdapter implements StoragePort {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static defaultOptions: Required<StoredValueOptions<any>> = {
    storage: window.localStorage,
    parse: JSON.parse,
    stringify: JSON.stringify,
  };

  value<T>(key: string, options?: StoredValueOptions<T>): StoredValue<T> {
    const { storage, parse, stringify } = {
      ...BrowserStorageAdapter.defaultOptions,
      ...options,
    };

    return {
      read: () => this.read<T>(storage, key, parse),
      write: (value) => this.write<T>(storage, key, value, stringify),
      listen: (onChange) => this.listen<T>(key, onChange, parse),
    };
  }

  private read<T>(storage: Storage, key: string, parse: Parse<T>): T | null {
    const value = storage.getItem(key);

    if (value === null) {
      return null;
    }

    return parse(value);
  }

  private write<T>(storage: Storage, key: string, value: T | null, stringify: Serialize<T>): void {
    if (value === null) {
      storage.removeItem(key);
    } else {
      storage.setItem(key, stringify(value));
    }
  }

  private listen<T>(key: string, onChange: ChangeListener<T>, parse: Parse<T>): () => void {
    const listener = (event: StorageEvent) => {
      if (event.key === key) {
        onChange(event.newValue === null ? null : parse(event.newValue));
      }
    };

    window.addEventListener('storage', listener);

    return () => {
      window.removeEventListener('storage', listener);
    };
  }
}
