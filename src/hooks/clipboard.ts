import { useCallback } from 'react';

import { hasMessage } from 'src/api/api-errors';
import { useTranslate } from 'src/intl/translate';

import { notify } from '../application/notify';

export function useClipboard() {
  const t = useTranslate();

  return useCallback(
    (text: string, cb?: () => void) => {
      const onError = (error: unknown) => {
        const message = hasMessage(error) ? error.message : t('common.clipboardError');
        notify.error(message);
      };

      navigator.clipboard.writeText(text).then(cb, onError);
    },
    [t],
  );
}
