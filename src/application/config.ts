import { z } from 'zod';

export type AppConfig = Partial<{
  environment: string;
  version: string;
  apiBaseUrl: string;
  websiteUrl: string;
  pageContextBaseUrl: string;
  recaptchaClientKey: string;
  posthogApiHost: string;
  posthogKey: string;
  stripePublicKey: string;
  mapboxToken: string;
  intercomAppId: string;
  disablePolling: boolean;
}>;

export interface ConfigPort {
  get<K extends keyof AppConfig>(key: K): AppConfig[K];
}

export class EnvConfigAdapter implements ConfigPort {
  private envConfig: AppConfig;
  private localConfig: AppConfig;

  constructor() {
    const string = (value?: string) => value ?? '';
    const boolean = (value?: string) => value === 'true';

    this.envConfig = {
      environment: string(import.meta.env.VITE_ENVIRONMENT),
      version: string(import.meta.env.VITE_APP_VERSION),
      apiBaseUrl: string(import.meta.env.VITE_API_URL),
      websiteUrl: string(import.meta.env.VITE_WEBSITE_URL),
      pageContextBaseUrl: string(import.meta.env.VITE_PAGE_CONTEXT_BASE_URL),
      recaptchaClientKey: string(import.meta.env.VITE_RECAPTCHA_CLIENT_KEY),
      posthogApiHost: string(import.meta.env.VITE_POSTHOG_API_HOST),
      posthogKey: string(import.meta.env.VITE_POSTHOG_KEY),
      stripePublicKey: string(import.meta.env.VITE_STRIPE_PUBLIC_KEY),
      mapboxToken: string(import.meta.env.VITE_MAPBOX_TOKEN),
      intercomAppId: string(import.meta.env.VITE_INTERCOM_APP_ID),
      disablePolling: boolean(import.meta.env.VITE_DISABLE_POLLING),
    };

    try {
      this.localConfig = z
        .record(z.string(), z.string())
        .parse(JSON.parse(localStorage.getItem('config') ?? ''));
    } catch {
      this.localConfig = {};
    }
  }

  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    if (key in this.localConfig) {
      return this.localConfig[key];
    }

    const value = this.envConfig[key];

    if (value === '') {
      return undefined;
    }

    return value;
  }
}

export class StubConfigAdapter implements ConfigPort {
  private config: AppConfig = {};

  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }

  set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    this.config[key] = value;
  }
}
