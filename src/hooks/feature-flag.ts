import posthog from 'posthog-js';
import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';

export function useFeatureFlag(feature: string) {
  const [enabled, setEnabled] = useState<boolean>();
  const localStorageFlags = useLocalStorageFlags();

  useEffect(() => {
    if (feature in localStorageFlags) {
      setEnabled(localStorageFlags[feature]);
    } else {
      posthog.onFeatureFlags(() => {
        setEnabled(posthog.isFeatureEnabled(feature) === true);
      });
    }
  }, [localStorageFlags, feature]);

  return enabled;
}

function useLocalStorageFlags() {
  return useMemo(() => {
    try {
      const schema = z.record(z.string(), z.boolean());
      const localStorageFlags: unknown = JSON.parse(localStorage.getItem('feature-flags') ?? '');

      return schema.parse(localStorageFlags);
    } catch {
      //
    }

    return {};
  }, []);
}
