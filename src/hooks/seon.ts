import seon, { SDKOptions } from '@seontechnologies/seon-javascript-sdk';
import { QueryClient } from '@tanstack/react-query';

import { apiQuery } from 'src/api';
import { getConfig } from 'src/application/config';
import { StoredValue } from 'src/application/storage';

// cSpell:ignore seontechnologies deviceinfresolver

const fingerprintRegistered = new StoredValue('seon:fingerprintRegistered', {
  parse: (value) => value === 'true',
  stringify: String,
});

export class SeonAdapter {
  private static options: SDKOptions = {
    dnsResolverDomain: 'deviceinfresolver.com',
    networkTimeoutMs: 5_000,
    fieldTimeoutMs: 5_000,
    silentMode: true,
  };

  async initialize(queryClient: QueryClient) {
    if (getConfig('environment') === 'development' || fingerprintRegistered.read()) {
      return;
    }

    seon.init();

    await queryClient.fetchQuery(
      apiQuery('get /v1/account/profile', {
        header: { 'seon-fp': await seon.getSession(SeonAdapter.options) },
      }),
    );

    fingerprintRegistered.write(true);
  }
}
