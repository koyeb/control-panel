import seon from '@seontechnologies/seon-javascript-sdk';
import { sub } from 'date-fns';
import { useCallback } from 'react';

import { getCookie, setCookie } from 'src/application/cookies';

import { useMount } from './lifecycle';

const cookieName = 'SSID';

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

  return useCallback(() => seon.getSession({ silentMode: true }), []);
}
