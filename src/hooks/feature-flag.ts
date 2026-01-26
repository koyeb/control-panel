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
  const localFlags = useLocalFlags();
  const posthogFlags = usePosthogFlags();

  return {
    listFlags: (): string[] => Object.keys(posthogFlags),
    getValue: (flag: string): [local?: boolean, posthog?: boolean] => [localFlags[flag], posthogFlags[flag]],
    isEnabled: (flag: string): boolean | undefined => localFlags[flag] ?? posthogFlags[flag],
    readStoredFlags,
    writeStoredFlags,
  };
}

export function useFeatureFlag(flag: string) {
  return useFeatureFlags().isEnabled(flag);
}

function useLocalFlags() {
  const [flags, setFlags] = useState(readStoredFlags);

  useEffect(() => {
    const onChange = () => setFlags(readStoredFlags);

    storageEmitter.addEventListener('change', onChange);

    return () => {
      storageEmitter.removeEventListener('change', onChange);
    };
  }, []);

  return flags;
}

function usePosthogFlags() {
  const [flags, setFlags] = useState<Record<string, boolean>>({});

  useEffect(() => {
    return posthog.onFeatureFlags(() => {
      const flags = toObject(posthog.featureFlags.getFlags(), identity, (flag) =>
        Boolean(posthog.isFeatureEnabled(flag)),
      );

      setFlags(flags);
    });
  }, []);

  return flags;
}

const storageEmitter = new EventTarget();
const storageKey = 'feature-flags';

function readStoredFlags() {
  const value = localStorage.getItem(storageKey);

  try {
    const schema = z.record(z.string(), z.boolean());
    const localStorageFlags: unknown = JSON.parse(value ?? '');

    return schema.parse(localStorageFlags);
  } catch {
    localStorage.removeItem(storageKey);
    return {};
  }
}

function writeStoredFlags(flags: Partial<Record<string, boolean>>) {
  localStorage.setItem(storageKey, JSON.stringify(flags));
  storageEmitter.dispatchEvent(new Event('change'));
}
