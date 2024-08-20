import { useCallback, useEffect, useState } from 'react';

import { assert } from 'src/utils/assert';

export const useLocalStorage = createUseStorage(window.localStorage);
export const useSessionStorage = createUseStorage(window.sessionStorage);

type UseStorageProps<T> = {
  parse: (value: string) => T;
  stringify: (value: T) => string;
};

function createUseStorage(storage: Storage) {
  const emitter = new EventTarget();

  class StorageChangedEvent extends Event {
    static type = 'storage-changed';

    constructor(
      public readonly key: string,
      public readonly value: unknown,
    ) {
      super(StorageChangedEvent.type);
    }
  }

  function onItemChanged<T>(key: string, data: T | undefined) {
    emitter.dispatchEvent(new StorageChangedEvent(key, data));
  }

  function useStorage<T>(key: string, { parse, stringify }: UseStorageProps<T> = JSON) {
    const [data, setData] = useState<T | undefined>(() => {
      const json = storage.getItem(key);

      if (json !== null) {
        return parse(json);
      }
    });

    useEffect(() => {
      const listener = (event: Event) => {
        assert(event instanceof StorageChangedEvent);

        if (event.key === key) {
          setData(event.value as T);
        }
      };

      emitter.addEventListener(StorageChangedEvent.type, listener);

      return () => {
        emitter.removeEventListener(StorageChangedEvent.type, listener);
      };
    }, [key]);

    const storeData = useCallback(
      (data: T) => {
        storage.setItem(key, stringify(data));
        onItemChanged(key, data);
      },
      [key, stringify],
    );

    const clearData = useCallback(() => {
      storage.removeItem(key);
      onItemChanged(key, undefined);
    }, [key]);

    return [data, storeData, clearData] as const;
  }

  useStorage.onItemChanged = onItemChanged;

  return useStorage;
}
