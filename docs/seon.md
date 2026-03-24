# Seon

[Seon](https://seon.io/) is a device fingerprinting / fraud detection service. It collects browser and device signals, generates a session fingerprint, and sends it to the Koyeb API so the backend can assess fraud risk.

## Initialization flow

The `SeonAdapter` class in `src/hooks/seon.ts` wraps the `@seontechnologies/seon-javascript-sdk` package. A single instance is created in `src/main.tsx` and passed into the router context.

Initialization is triggered once per session in the `_main` layout route loader (`src/routes/_main/route.tsx`), when the user first enters an authenticated page:

```ts
seon.initialize(queryClient).catch(reportError);
```

1. Skip if the environment is `development`, or if the fingerprint was already registered (persisted in `localStorage` under `seon:fingerprintRegistered`)
2. Call `seon.init()` to bootstrap the SDK and collect device signals
3. Call `seon.getSession(options)` to generate a fingerprint string
4. Send the fingerprint as a `seon-fp` header on a `GET /v1/account/profile` request
5. Write `seon:fingerprintRegistered = true` to `localStorage` so it doesn't run again

> **Note**: The fingerprint is collected **once per browser** (until `localStorage` is cleared).

## Configuration

The SDK is configured with hardcoded options — no API keys or environment variables are needed:

```ts
private static options: SDKOptions = {
  dnsResolverDomain: 'deviceinfresolver.com',
  networkTimeoutMs: 5_000,
  fieldTimeoutMs: 5_000,
  silentMode: true,
};
```

`silentMode: true` prevents the SDK from throwing errors. Seon is completely disabled in development (`VITE_ENVIRONMENT === 'development'`).
