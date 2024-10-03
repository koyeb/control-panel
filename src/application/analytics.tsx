import posthog from 'posthog-js';
import { createContext, useCallback, useContext, useEffect } from 'react';
// eslint-disable-next-line no-restricted-imports
import { useLocation } from 'wouter';

import { useOrganizationUnsafe, useUserUnsafe } from 'src/api/hooks/session';
import { AssertionError, defined } from 'src/utils/assert';

import { getConfig } from './config';
import { identifyUserInSentry } from './report-error';

/* eslint-disable react-refresh/only-export-components */

declare global {
  // eslint-disable-next-line no-var
  var Intercom: ((action: string, param?: unknown) => void) | undefined;
}

export type Analytics = Pick<typeof posthog, 'init' | 'identify' | 'group' | 'capture' | 'reset'>;

const analyticsContext = createContext<Analytics>(null as never);

type AnalyticsProviderProps = {
  analytics: Analytics;
  children: React.ReactNode;
};

export function AnalyticsProvider({ analytics, children }: AnalyticsProviderProps) {
  return (
    <analyticsContext.Provider value={analytics}>
      <Initialize />
      <TrackPageViews />
      {children}
    </analyticsContext.Provider>
  );
}

function Initialize() {
  const analytics = useAnalytics();

  useEffect(() => {
    const { posthogKey } = getConfig();

    if (posthogKey === undefined) {
      return;
    }

    analytics.init(posthogKey, {
      api_host: 'https://eu.posthog.com',
      capture_pageview: false,
      capture_pageleave: true,
      autocapture: false,
    });
  });

  return null;
}

function TrackPageViews() {
  const [location] = useLocation();
  const analytics = useAnalytics();

  useEffect(() => {
    analytics.capture('$pageview', {
      $current_url: window.location.href,
    });
  }, [location, analytics]);

  return null;
}

function useAnalytics() {
  return defined(useContext(analyticsContext), new AssertionError('Missing analytics provider'));
}

export function useIdentifyUser() {
  const analytics = useAnalytics();

  const user = useUserUnsafe();
  const organization = useOrganizationUnsafe();

  useEffect(() => {
    identifyUserInSentry(user);

    if (user !== undefined) {
      analytics.identify(user.id);
    }
  }, [analytics, user]);

  useEffect(() => {
    if (organization !== undefined) {
      analytics.group('segment_group', organization.id);
    }
  }, [analytics, organization]);
}

export function useResetIdentifyUser() {
  const analytics = useAnalytics();

  return useCallback(() => {
    globalThis.Intercom?.('shutdown');
    analytics.reset();
  }, [analytics]);
}

export function useTrackEvent() {
  const analytics = useAnalytics();

  return useCallback(
    (event: string, properties: { category?: string; action: string; [key: string]: unknown }) => {
      analytics.capture(event, properties);
    },
    [analytics],
  );
}

abstract class StubAnalytics implements Analytics {
  init(token: string, config?: Record<string, unknown>): undefined {
    this.method('init', { token, config });
  }

  identify(userId: string): void {
    this.method('identify', { userId });
  }

  group(group: string, value: string): void {
    this.method('group', { group, value });
  }

  capture(eventName: string, properties: Record<string, unknown>): undefined {
    this.method('track', { eventName, properties });
  }

  reset(): void {
    this.method('reset');
  }

  protected abstract method(name: string, args?: Record<string, unknown>): void;
}

export class NoopAnalytics extends StubAnalytics {
  protected method(): void {}
}

export class LogAnalytics extends StubAnalytics {
  protected method(name: string, args?: Record<string, unknown>): void {
    // eslint-disable-next-line no-console
    console.log(`StubAnalytics.${name}`, args);
  }
}
