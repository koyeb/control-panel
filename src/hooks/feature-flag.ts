// eslint-disable-next-line no-restricted-imports
import posthog from 'posthog-js';
// eslint-disable-next-line no-restricted-imports
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { useMemo } from 'react';
import { z } from 'zod';

type FeatureFlagProps = {
  feature: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

export function FeatureFlag({ feature, fallback = null, children }: FeatureFlagProps) {
  const enabled = useFeatureFlag(feature);

  if (!enabled) {
    return fallback;
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

export async function getFeatureFlag(flag: string) {
  if (posthog.isFeatureEnabled(flag) === undefined) {
    await new Promise((resolve) => posthog.onFeatureFlags(resolve));
  }

  return Boolean(posthog.isFeatureEnabled(flag));
}
