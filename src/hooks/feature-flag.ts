// eslint-disable-next-line no-restricted-imports
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { useMemo } from 'react';
import { z } from 'zod';

export function FeatureFlag({ feature, children }: { feature: string; children: React.ReactNode }) {
  const enabled = useFeatureFlag(feature);

  if (!enabled) {
    return null;
  }

  return children;
}

export function useFeatureFlag(flag: string) {
  const enabled = useFeatureFlagEnabled(flag);
  const localStorageFlags = useLocalStorageFlags();

  if (flag in localStorageFlags) {
    return localStorageFlags[flag];
  }

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
