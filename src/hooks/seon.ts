import seon, { SDKOptions } from '@seontechnologies/seon-javascript-sdk';

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
    if (!this.initialized) {
      seon.init();
      this.initialized = true;
    }

    return seon.getSession(SeonAdapter.options);
  }
}
