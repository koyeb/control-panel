import * as intercom from '@intercom/messenger-js-sdk';
import { PostHogProvider, usePostHog } from 'posthog-js/react';
import { useCallback, useEffect } from 'react';
// eslint-disable-next-line no-restricted-imports
import { useLocation } from 'wouter';

import { useOrganizationUnsafe, useUserUnsafe } from 'src/api/hooks/session';

import { getConfig } from './config';
import { identifyUserInSentry } from './report-error';

type AnalyticsProviderProps = {
  children: React.ReactNode;
};

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const { posthogKey } = getConfig();

  if (posthogKey === undefined) {
    return children;
  }

  return (
    <PostHogProvider
      apiKey={posthogKey}
      options={{
        api_host: 'https://ph.koyeb.com',
        ui_host: 'https://eu.posthog.com',
        capture_pageview: false,
        capture_pageleave: true,
        autocapture: false,
      }}
    >
      <TrackPageViews />
      <IdentifyUser />
      {children}
    </PostHogProvider>
  );
}

function TrackPageViews() {
  const [location] = useLocation();
  const posthog = usePostHog();

  useEffect(() => {
    posthog?.capture('$pageview', {
      $current_url: window.location.href,
    });
  }, [location, posthog]);

  return null;
}

function IdentifyUser() {
  const posthog = usePostHog();

  const user = useUserUnsafe();
  const organization = useOrganizationUnsafe();

  useEffect(() => {
    identifyUserInSentry(user);

    if (user !== undefined) {
      posthog?.identify(user.id);
    }
  }, [posthog, user]);

  useEffect(() => {
    if (organization !== undefined) {
      posthog?.group('segment_group', organization.id);
    }
  }, [posthog, organization]);

  return null;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useResetIdentifyUser() {
  const posthog = usePostHog();

  return useCallback(() => {
    intercom.shutdown();
    posthog?.reset(true);
  }, [posthog]);
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTrackEvent() {
  const posthog = usePostHog();

  return useCallback(
    (event: string, properties: Record<string, unknown> = {}) => {
      posthog?.capture(event, properties);
    },
    [posthog],
  );
}
