import seon, { SDKOptions } from '@seontechnologies/seon-javascript-sdk';
import { sub } from 'date-fns';
import { useCallback } from 'react';

import { getCookie, setCookie } from 'src/application/cookies';

import { useMount } from './lifecycle';

const cookieName = 'SSID';

const options: SDKOptions = {
  dnsResolverDomain: 'deviceinfresolver.com',
  networkTimeoutMs: 5_000,
  fieldTimeoutMs: 5_000,
  silentMode: true,
};

export function useSeon() {
  useMount(() => {
    seon.init();

    if (getCookie(cookieName)) {
      setCookie(cookieName, '', {
        Path: '/',
        Secure: window.location.protocol === 'https',
        SameSite: 'strict',
        Expires: sub(new Date(), { seconds: 1 }).toUTCString(),
      });
    }
  });

  return useCallback(() => seon.getSession(options), []);
}
