import { AnalyticsBrowser, EventProperties, Integrations, Options } from '@segment/analytics-next';
import posthog from 'posthog-js';
import { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import { usePathname } from 'wouter/use-browser-location';

import { api } from 'src/api/api';
import { useOrganizationUnsafe, useUserUnsafe } from 'src/api/hooks/session';
import { User } from 'src/api/model';
import { AssertionError, defined } from 'src/utils/assert';

import { getConfig } from './config';
import { identifyUserInSentry, reportError } from './report-error';
import { getToken } from './token';

/* eslint-disable react-refresh/only-export-components */

declare global {
  // eslint-disable-next-line no-var
  var Intercom: ((action: string, param?: unknown) => void) | undefined;
}

export interface Analytics {
  instance?: AnalyticsBrowser['instance'];
  load(options: { writeKey: string; cdnURL: string }): void;
  ready(): Promise<unknown>;
  identify(userId: string, traits: Record<string, string>, options: Options): Promise<unknown>;
  track(eventName: string, properties: EventProperties, options: Options): Promise<unknown>;
  page(pathname: string, name: undefined, properties: undefined, options: Options): Promise<unknown>;
  reset(): Promise<unknown>;
}

const analyticsContext = createContext<{
  analytics: Analytics;
  context: Record<string, string>;
}>(null as never);

type AnalyticsProviderProps = {
  analytics: Analytics;
  children: React.ReactNode;
};

export function AnalyticsProvider({ analytics, children }: AnalyticsProviderProps) {
  const context = useRef<Record<string, string>>({});

  useEffect(() => {
    initialize(analytics).catch(reportError);
  }, [analytics]);

  return (
    <analyticsContext.Provider value={{ analytics, context: context.current }}>
      <TrackPageViews />
      {children}
    </analyticsContext.Provider>
  );
}

async function initialize(analytics: Analytics) {
  const { posthogKey, segmentWriteKey } = getConfig();

  if (segmentWriteKey === undefined) {
    return;
  }

  analytics.load({
    writeKey: segmentWriteKey,
    cdnURL: 'https://scdn.koyeb.com',
  });

  await analytics.ready();

  if (posthogKey === undefined) {
    return;
  }

  posthog.init(posthogKey, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    segment: analytics.instance as any,
    api_host: 'https://eu.posthog.com',
    capture_pageview: false,
    autocapture: false,
    persistence: 'localStorage',
  });
}

function TrackPageViews() {
  const pathname = usePathname();
  const { analytics, context } = useAnalytics();

  useEffect(() => {
    analytics.page(pathname, undefined, undefined, { context }).catch(reportError);
  }, [pathname, analytics, context]);

  return null;
}

function useAnalytics() {
  return defined(useContext(analyticsContext), new AssertionError('Missing analytics provider'));
}

export function useIdentifyUser() {
  const { analytics, context } = useAnalytics();

  const user = useUserUnsafe();
  const organization = useOrganizationUnsafe();

  useEffect(() => {
    identifyUserInSentry(user);

    if (user !== undefined) {
      identifyUser(analytics, user, context).catch(reportError);
    }
  }, [analytics, context, user]);

  useEffect(() => {
    if (organization) {
      posthog.group('segment_group', organization.id);
    }
  }, [analytics, context, organization]);
}

async function identifyUser(analytics: Analytics, user: User, context: Record<string, string>) {
  const traits = {};
  const integrations: Integrations = {};

  await api
    .getIntercomUserHash({
      token: getToken(),
    })
    .then(({ hash }) => {
      if (hash !== undefined) {
        integrations.Intercom = { user_hash: hash };
      }
    }, reportError);

  await analytics.identify(user.id, traits, { context, integrations });
}

export function useResetIdentifyUser() {
  const { analytics } = useAnalytics();

  return useCallback(() => {
    globalThis.Intercom?.('shutdown');
    analytics.reset().catch(reportError);
  }, [analytics]);
}

export function useTrackEvent() {
  const { analytics, context } = useAnalytics();

  return useCallback(
    (eventName: string, properties: { category?: string; action: string; [key: string]: unknown }) => {
      analytics.track(eventName, properties, { context }).catch(reportError);
    },
    [analytics, context],
  );
}

abstract class StubAnalytics implements Analytics {
  load(options: { writeKey: string; cdnURL: string }): void {
    this.method('load', { options });
  }

  async ready(): Promise<void> {
    this.method('ready');
  }

  async identify(userId: string, traits: Record<string, string>, options: Options): Promise<unknown> {
    return this.method('identify', { userId, traits, options });
  }

  async track(eventName: string, properties: EventProperties, options: Options): Promise<unknown> {
    return this.method('track', { eventName, properties, options });
  }

  async page(pathname: string, name: undefined, properties: undefined, options: Options): Promise<unknown> {
    return this.method('page', { pathname, name, properties, options });
  }

  async reset(): Promise<unknown> {
    return this.method('reset');
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
