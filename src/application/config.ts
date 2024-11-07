import { z } from 'zod';

type AppConfig = Partial<{
  environment: string;
  version: string;
  apiBaseUrl: string;
  pageContextBaseUrl: string;
  idenfyServiceBaseUrl: string;
  recaptchaClientKey: string;
  posthogKey: string;
  stripePublicKey: string;
  mapboxToken: string;
  intercomAppId: string;
  disablePolling: boolean;
  aiAssistantApiUrl: string;
}>;

const { data: localStorageConfig = {} } = z
  .record(z.string(), z.string())
  .safeParse(JSON.parse(localStorage.getItem('config') ?? '{}'));

export function getConfig(): AppConfig {
  const envConfig = {
    environment: import.meta.env.VITE_ENVIRONMENT,
    version: import.meta.env.VITE_APP_VERSION,
    apiBaseUrl: import.meta.env.VITE_API_URL,
    aiAssistantApiUrl: import.meta.env.VITE_AI_ASSISTANT_API_URL,
    pageContextBaseUrl: import.meta.env.VITE_PAGE_CONTEXT_BASE_URL,
    idenfyServiceBaseUrl: import.meta.env.VITE_IDENFY_SERVICE_BASE_URL,
    recaptchaClientKey: import.meta.env.VITE_RECAPTCHA_CLIENT_KEY,
    posthogKey: import.meta.env.VITE_POSTHOG_KEY,
    stripePublicKey: import.meta.env.VITE_STRIPE_PUBLIC_KEY,
    mapboxToken: import.meta.env.VITE_MAPBOX_TOKEN,
    intercomAppId: import.meta.env.VITE_INTERCOM_APP_ID,
    disablePolling: import.meta.env.VITE_DISABLE_POLLING,
  };

  const getValue = (name: keyof AppConfig) => {
    const value = localStorageConfig[name] ?? envConfig[name];

    if (value === '') {
      return undefined;
    }

    return value;
  };

  return {
    environment: getValue('environment'),
    version: getValue('version'),
    apiBaseUrl: getValue('apiBaseUrl'),
    pageContextBaseUrl: getValue('pageContextBaseUrl'),
    recaptchaClientKey: getValue('recaptchaClientKey'),
    posthogKey: getValue('posthogKey'),
    stripePublicKey: getValue('stripePublicKey'),
    mapboxToken: getValue('mapboxToken'),
    idenfyServiceBaseUrl: getValue('idenfyServiceBaseUrl'),
    intercomAppId: getValue('intercomAppId'),
    disablePolling: getValue('disablePolling') === 'true',
    aiAssistantApiUrl: getValue('aiAssistantApiUrl'),
  };
}

declare global {
  interface Window {
    getConfig: typeof getConfig;
  }
}

window.getConfig = getConfig;
