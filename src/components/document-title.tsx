import { useEffect } from 'react';

import { Translate } from 'src/intl/translate';

const T = Translate.prefix('documentTitle');

export function DocumentTitle({ title }: { title?: string }) {
  const t = T.useTranslate();

  useEffect(() => {
    const prevTitle = document.title;

    document.title = title ? title + t('suffix') : t('default');

    return () => {
      document.title = prevTitle;
    };
  }, [title, t]);

  return null;
}
