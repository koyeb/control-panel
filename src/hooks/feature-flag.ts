import posthog from 'posthog-js';
import { useEffect, useState } from 'react';

export function useFeatureFlag(feature: string) {
  const [enabled, setEnabled] = useState<boolean>();

  useEffect(() => {
    // eslint-disable-next-line no-console
    loadFeatureFlag(feature).then(setEnabled, console.error);
  }, [feature]);

  return enabled;
}

async function loadFeatureFlag(feature: string) {
  await new Promise((resolve) => {
    posthog.onFeatureFlags(resolve);
  });

  return posthog.isFeatureEnabled(feature) === true;
}
