import { Helmet } from 'react-helmet';

import { createTranslate } from 'src/intl/translate';

const T = createTranslate('components.documentTitle');

export function DocumentTitle({ title }: { title?: string }) {
  const t = T.useTranslate();

  return (
    <Helmet>
      <title>{t('title', { prefix: title })}</title>
    </Helmet>
  );
}
