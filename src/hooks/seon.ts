import seon, { SDKOptions } from '@seontechnologies/seon-javascript-sdk';
import { useRouteContext } from '@tanstack/react-router';
import { useCallback } from 'react';

// cSpell:ignore seontechnologies deviceinfresolver

export interface SeonPort {
  getFingerprint(): Promise<string>;
}

export class SeonAdapter implements SeonPort {
  private static options: SDKOptions = {
    dnsResolverDomain: 'deviceinfresolver.com',
    networkTimeoutMs: 5_000,
    fieldTimeoutMs: 5_000,
    silentMode: true,
  };

  private initialized = false;

  async getFingerprint(): Promise<string> {
    if (!this.initialized) {
      seon.init();
      this.initialized = true;
    }

    return seon.getSession(SeonAdapter.options);
  }
}

export function useSeon() {
  const seon = useRouteContext({ from: '__root__', select: (ctx) => ctx.seon });

  return useCallback(() => seon.getFingerprint(), [seon]);
}
