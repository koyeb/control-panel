import seon, { SDKOptions } from '@seontechnologies/seon-javascript-sdk';
import { useCallback } from 'react';

import { container } from 'src/application/container';
import { TOKENS } from 'src/tokens';

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
  const seon = container.resolve(TOKENS.seon);

  return useCallback(() => seon.getFingerprint(), [seon]);
}
