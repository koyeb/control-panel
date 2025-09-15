import { useEffect } from 'react';

import { createTranslate } from 'src/intl/translate';

const T = createTranslate('components.documentTitle');

export function DocumentTitle({ title }: { title?: string }) {
  const t = T.useTranslate();

  useEffect(() => {
    const prev = document.title;

    document.title = t('title', { prefix: title }) as string;

    return () => {
      document.title = prev;
    };
  }, [t, title]);

  return null;
}
