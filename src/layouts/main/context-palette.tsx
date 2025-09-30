import { useCallback, useEffect, useRef, useState } from 'react';
import z from 'zod';

import { useUserUnsafe } from 'src/api';
import { getConfig } from 'src/application/config';
import { notify } from 'src/application/notify';
import { useToken } from 'src/application/token';
import { createValidationGuard } from 'src/application/validation';
import { Dialog } from 'src/components/dialog';
import { useLocation } from 'src/hooks/router';
import { useShortcut } from 'src/hooks/shortcut';
import { useThemeModeOrPreferred } from 'src/hooks/theme';

export function ContextPalette() {
  const token = useToken();
  const location = useLocation();
  const theme = useThemeModeOrPreferred();

  const user = useUserUnsafe();
  const pageContextBaseUrl = getConfig('pageContextBaseUrl');

  const enabled = Boolean(pageContextBaseUrl !== undefined && user?.flags.includes('ADMIN'));

  const iFrameRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(0);

  const openDialog = Dialog.useOpen();
  const closeDialog = Dialog.useClose();

  const postMessage = useCallback((message: unknown) => {
    const pageContextBaseUrl = getConfig('pageContextBaseUrl');

    if (pageContextBaseUrl) {
      iFrameRef.current?.contentWindow?.postMessage(message, pageContextBaseUrl);
    }
  }, []);

  useEffect(() => {
    const pageContextBaseUrl = getConfig('pageContextBaseUrl');

    function listener(event: MessageEvent<unknown>) {
      if (event.origin !== pageContextBaseUrl) {
        return;
      }

      if (isReadyEvent(event.data)) {
        postMessage({ token });
        setReady((ready) => ready + 1);
      }

      if (isCloseEvent(event.data)) {
        closeDialog();
      }

      if (isErrorEvent(event.data)) {
        notify.error(event.data.error.message);
      }
    }

    window.addEventListener('message', listener);

    return () => {
      window.removeEventListener('message', listener);
    };
  }, [iFrameRef, token, closeDialog, postMessage]);

  useEffect(() => {
    if (ready) {
      postMessage({ location });
    }
  }, [ready, location, postMessage]);

  useShortcut(['meta', 'j'], () => enabled && openDialog('ContextPalette'));

  return (
    <Dialog id="ContextPalette" className="p-0!">
      <iframe
        ref={iFrameRef}
        src={`${getConfig('pageContextBaseUrl')}/command-palette?theme=${theme}`}
        allow="clipboard-write"
        width={840}
        height={380}
      />
    </Dialog>
  );
}

const isReadyEvent = createValidationGuard(z.object({ ready: z.literal(true) }));
const isCloseEvent = createValidationGuard(z.object({ close: z.literal(true) }));
const isErrorEvent = createValidationGuard(z.object({ error: z.object({ message: z.string() }) }));
