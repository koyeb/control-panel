import { z } from 'zod';

export type AppConfig = Partial<Record<keyof typeof envVars, string>>;

const envVars = {
  environment: 'VITE_ENVIRONMENT',
  version: 'VITE_APP_VERSION',
  apiBaseUrl: 'VITE_API_URL',
  websiteUrl: 'VITE_WEBSITE_URL',
  pageContextBaseUrl: 'VITE_PAGE_CONTEXT_BASE_URL',
  recaptchaClientKey: 'VITE_RECAPTCHA_CLIENT_KEY',
  posthogApiHost: 'VITE_POSTHOG_API_HOST',
  posthogKey: 'VITE_POSTHOG_KEY',
  stripePublicKey: 'VITE_STRIPE_PUBLIC_KEY',
  mapboxToken: 'VITE_MAPBOX_TOKEN',
  intercomAppId: 'VITE_INTERCOM_APP_ID',
  workOsApiHost: 'VITE_WORK_OS_API_HOST',
  workOsClientId: 'VITE_WORK_OS_CLIENT_ID',
  sentryDsn: 'VITE_SENTRY_DSN',
};

const localConfig: AppConfig = {};

if (typeof window !== 'undefined') {
  const { success, data } = z
    .record(z.string(), z.string())
    .safeParse(JSON.parse(localStorage.getItem('config') ?? '{}'));

  if (success) {
    Object.assign(localConfig, data);
  }
}

export function getConfig<K extends keyof AppConfig>(key: K): AppConfig[K] {
  if (key in localConfig) {
    return localConfig[key];
  }

  const value: string | undefined = import.meta.env[envVars[key]];

  if (value === '') {
    return undefined;
  }

  return value;
}
