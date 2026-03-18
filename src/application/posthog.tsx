/* eslint-disable no-restricted-imports, react-refresh/only-export-components */
import posthog from 'posthog-js';
import { PostHog, PostHogProvider as PostHogJsProvider, usePostHog } from 'posthog-js/react';
import { useCallback, useEffect } from 'react';

import { useLocation } from 'src/hooks/router';

import { getConfig } from './config';

export { type PostHog };

type PostHogProviderProps = {
  client: PostHog | null;
  children: React.ReactNode;
};

export function PostHogProvider({ client, children }: PostHogProviderProps) {
  if (!client) {
    return children;
  }

  return <PostHogJsProvider client={client}>{children}</PostHogJsProvider>;
}

export function initPosthog() {
  const posthogApiHost = getConfig('posthogApiHost');
  const posthogKey = getConfig('posthogKey');

  if (posthogApiHost === undefined || posthogKey === undefined) {
    return null;
  }

  // cSpell:ignore pageleave autocapture
  return posthog.init(posthogKey, {
    api_host: posthogApiHost,
    ui_host: 'https://eu.posthog.com',
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: false,
  });
}

export function TrackPageViews() {
  const location = useLocation();
  const posthog = usePostHog();

  useEffect(() => {
    posthog.capture('$pageview', {
      $current_url: window.location.href,
    });
  }, [location, posthog]);

  return null;
}

export function useTrackEvent() {
  const posthog = usePostHog();

  return useCallback(
    (event: string, properties: Record<string, unknown> = {}) => {
      posthog.capture(event, properties);
    },
    [posthog],
  );
}
