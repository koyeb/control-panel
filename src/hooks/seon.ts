import { add } from 'date-fns';
import { useCallback } from 'react';

import { getCookie, setCookie } from 'src/application/cookies';
import { reportError } from 'src/application/report-error';
import { wait } from 'src/utils/promises';

import { useMount } from './lifecycle';

type SeonConfigOptions = {
  host: string;
  session_id: string;
  audio_fingerprint: boolean;
  canvas_fingerprint: boolean;
  webgl_fingerprint: boolean;
  onSuccess: () => void;
  onError: (message: unknown) => void;
};

type Seon = {
  config: (options: SeonConfigOptions) => void;
  getBase64Session: () => Promise<string>;
};

declare global {
  interface Window {
    seon?: Seon;
  }
}

const timeout = 5 * 1000;
const hostname = 'app.koyeb.com';
const cookieName = 'SSID';

export function useSeon() {
  useMount(() => {
    if (document.getElementById('seon-script') !== null) {
      return;
    }

    const script = document.createElement('script');

    script.id = 'seon-script';
    script.src = 'https://cdn.seondf.com/js/v5/agent.js';
    script.async = true;

    document.body.appendChild(script);
  });

  return useCallback(async () => {
    const seon = await getSeon();

    return seon?.getBase64Session();
  }, []);
}

async function getSeon() {
  const start = Date.now();
  const elapsed = () => Date.now() - start;

  while (!window.seon && elapsed() < timeout) {
    await wait(10);
  }

  const seon = window.seon;

  if (seon === undefined) {
    reportError(new Error('window.seon is not defined'));
    return undefined;
  }

  await new Promise<void>((resolve, reject) => {
    seon.config({
      host: hostname,
      session_id: getSessionId(),
      audio_fingerprint: true,
      canvas_fingerprint: true,
      webgl_fingerprint: true,
      onSuccess: resolve,
      onError: reject,
    });
  });

  return seon;
}

function getSessionId() {
  let sessionId = getCookie(cookieName);

  if (sessionId) {
    return sessionId;
  }

  sessionId = globalThis.crypto.randomUUID();

  setCookie(cookieName, sessionId, {
    Path: '/',
    Secure: window.location.protocol === 'https',
    SameSite: 'strict',
    Expires: add(new Date(), { years: 1 }).toUTCString(),
  });

  return sessionId;
}
