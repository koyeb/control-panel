import { useCallback } from 'react';

import { hasMessage } from 'src/api/api-errors';
import { useTranslate } from 'src/intl/translate';

import { notify } from '../application/notify';

export function useClipboard() {
  const t = useTranslate();
  const clipboardError = t('common.clipboardError');

  return useCallback(
    (text: string, cb?: () => void) => {
      const onError = (error: unknown) => {
        const message = hasMessage(error) ? error.message : clipboardError;
        notify.error(message);
      };

      navigator.clipboard.writeText(text).then(cb, onError);
    },
    [clipboardError],
  );
}
