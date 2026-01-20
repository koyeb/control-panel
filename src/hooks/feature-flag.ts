// eslint-disable-next-line no-restricted-imports
import posthog from 'posthog-js';
import { useEffect, useState } from 'react';
import { z } from 'zod';

import { identity } from 'src/utils/generic';
import { toObject } from 'src/utils/object';

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

export function useFeatureFlags() {
  const [flags, setFlags] = useState(() => new FeatureFlags());

  useEffect(() => {
    flags.addListener(() => setFlags(new FeatureFlags()));
  }, [flags]);

  return flags;
}

export function useFeatureFlag(flag: string) {
  return useFeatureFlags().isEnabled(flag);
}

class FeatureFlags {
  private static storageEmitter = new EventTarget();
  private static storageKey = 'feature-flags';
  private storageValue = localStorage.getItem(FeatureFlags.storageKey);

  private get storageFlags() {
    try {
      const schema = z.record(z.string(), z.boolean());
      const localStorageFlags: unknown = JSON.parse(this.storageValue ?? '');

      return schema.parse(localStorageFlags);
    } catch {
      localStorage.removeItem('feature-flags');
      return {};
    }
  }

  listFlags(): string[] {
    return posthog.featureFlags.getFlags();
  }

  getValue(flag: string): [posthog: boolean | undefined, local: boolean | undefined] {
    return [posthog.isFeatureEnabled(flag), this.storageFlags[flag]];
  }

  isEnabled(flag: string): boolean | undefined {
    const [posthog, local] = this.getValue(flag);

    if (local !== undefined) {
      return local;
    }

    return posthog;
  }

  setLocalValue(flag: string, value: boolean | undefined): void {
    localStorage.setItem(
      FeatureFlags.storageKey,
      JSON.stringify({
        ...this.storageFlags,
        [flag]: value,
      }),
    );

    FeatureFlags.storageEmitter.dispatchEvent(new Event('change'));
  }

  setAllLocalValues(value: boolean | undefined): void {
    if (value === undefined) {
      localStorage.removeItem(FeatureFlags.storageKey);
    } else {
      localStorage.setItem(
        FeatureFlags.storageKey,
        JSON.stringify(toObject(this.listFlags(), identity, () => value)),
      );
    }

    FeatureFlags.storageEmitter.dispatchEvent(new Event('change'));
  }

  addListener(listener: () => void) {
    FeatureFlags.storageEmitter.addEventListener('change', listener);
  }
}
