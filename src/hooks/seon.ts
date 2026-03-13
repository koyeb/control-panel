import seon, { SDKOptions } from '@seontechnologies/seon-javascript-sdk';

import { getConfig } from 'src/application/config';

// cSpell:ignore seontechnologies deviceinfresolver

export class SeonAdapter {
  private static options: SDKOptions = {
    dnsResolverDomain: 'deviceinfresolver.com',
    networkTimeoutMs: 5_000,
    fieldTimeoutMs: 5_000,
    silentMode: true,
  };

  private initialized = false;

  async getFingerprint(): Promise<string> {
    if (getConfig('environment') === 'development') {
      return '';
    }

    if (!this.initialized) {
      seon.init();
      this.initialized = true;
    }

    return seon.getSession(SeonAdapter.options);
  }
}
