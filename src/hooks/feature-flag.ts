import posthog from 'posthog-js';
import { useEffect, useState } from 'react';

export function useFeatureFlag(feature: string) {
  const [enabled, setEnabled] = useState<boolean>();

  useEffect(() => {
    posthog.onFeatureFlags(() => {
      setEnabled(posthog.isFeatureEnabled(feature) === true);
    });
  }, [feature]);

  return enabled;
}
