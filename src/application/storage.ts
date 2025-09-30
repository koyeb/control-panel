type Parse<T> = (value: string) => T;
type Serialize<T> = (value: T) => string;
type ChangeListener<T> = (value: T | null) => void;

type StoredValueOptions<T> = {
  storage?: Storage;
  parse?: Parse<T>;
  stringify?: Serialize<T>;
};

export class StoredValue<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static defaultOptions: Required<StoredValueOptions<any>> = {
    storage: window.localStorage,
    parse: JSON.parse,
    stringify: JSON.stringify,
  };

  private key: string;
  private options: Required<StoredValueOptions<T>>;

  constructor(key: string, options?: StoredValueOptions<T>) {
    this.key = key;

    this.options = {
      ...StoredValue.defaultOptions,
      ...options,
    };
  }

  read(): T | null {
    const { storage, parse } = this.options;
    const value = storage.getItem(this.key);

    if (value === null) {
      return null;
    }

    return parse(value);
  }

  write(value: T | null): void {
    const { storage, stringify } = this.options;

    if (value === null) {
      storage.removeItem(this.key);
    } else {
      storage.setItem(this.key, stringify(value));
    }
  }

  listen(onChange: ChangeListener<T>): () => void {
    const { parse } = this.options;

    const listener = (event: StorageEvent) => {
      if (event.key === this.key) {
        onChange(event.newValue === null ? null : parse(event.newValue));
      }
    };

    window.addEventListener('storage', listener);

    return () => {
      window.removeEventListener('storage', listener);
    };
  }
}
