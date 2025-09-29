// eslint-disable-next-line no-restricted-imports
import { PostHog, PostHogProvider as PostHogJsProvider, usePostHog as usePostHogJs } from 'posthog-js/react';
import { useCallback, useEffect } from 'react';

import { useUserUnsafe } from 'src/api/hooks/session';
import { User } from 'src/api/model';
import { useLocation } from 'src/hooks/router';
import { getConfig } from 'src/utils/config';

import { identifyUserInIntercom } from './intercom';
import { identifyUserInSentry } from './sentry';

// cSpell:ignore pageleave autocapture

type PostHogProviderProps = {
  children: React.ReactNode;
};

export function PostHogProvider({ children }: PostHogProviderProps) {
  const posthogApiHost = getConfig('posthogApiHost');
  const posthogKey = getConfig('posthogKey');

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
      <Identify />
      <TrackPageViews />
      {children}
    </PostHogJsProvider>
  );
}

function usePostHog(): PostHog | undefined {
  return usePostHogJs();
}

function Identify() {
  const user = useUserUnsafe();
  const [identify] = useIdentifyUser();

  useEffect(() => {
    if (user) {
      identify(user);
    }
  }, [identify, user]);

  return null;
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

// eslint-disable-next-line react-refresh/only-export-components
export function useIdentifyUser() {
  const posthog = usePostHog();

  const identify = useCallback(
    (user: User) => {
      posthog?.identify(user.id);
      identifyUserInSentry(user);
      identifyUserInIntercom(user);
    },
    [posthog],
  );

  const clear = useCallback(() => {
    posthog?.reset();
    identifyUserInSentry(null);
    identifyUserInIntercom(null);
  }, [posthog]);

  return [identify, clear] as const;
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
