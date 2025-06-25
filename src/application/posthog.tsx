import * as intercom from '@intercom/messenger-js-sdk';
// eslint-disable-next-line no-restricted-imports
import { PostHog, PostHogProvider as PostHogJsProvider, usePostHog as usePostHogJs } from 'posthog-js/react';
import { useCallback, useEffect } from 'react';

import { useOrganizationUnsafe, useUserUnsafe } from 'src/api/hooks/session';

import { getConfig } from './config';
import { identifyUserInSentry } from './report-error';
import { useLocation } from 'src/hooks/router';

// cSpell:ignore pageleave autocapture

type PostHogProviderProps = {
  children: React.ReactNode;
};

export function PostHogProvider({ children }: PostHogProviderProps) {
  const { posthogApiHost, posthogKey } = getConfig();

  if (posthogApiHost === undefined || posthogKey === undefined) {
    return children;
  }

  return (
    <PostHogJsProvider
      apiKey={posthogKey}
      options={{
        api_host: posthogApiHost,
        ui_host: 'https://eu.posthog.com',
        capture_pageview: false,
        capture_pageleave: true,
        autocapture: false,
      }}
    >
      <TrackPageViews />

      {children}
    </PostHogJsProvider>
  );
}

function usePostHog(): PostHog | undefined {
  return usePostHogJs();
}

function TrackPageViews() {
  const location = useLocation();
  const posthog = usePostHog();

  useEffect(() => {
    posthog?.capture('$pageview', {
      $current_url: window.location.href,
    });
  }, [location, posthog]);

  return null;
}

export function IdentifyUser() {
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
    if (organization !== null) {
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
