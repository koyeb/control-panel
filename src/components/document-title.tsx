import { Helmet } from 'react-helmet';

import { useTranslate } from 'src/intl/translate';

export function DocumentTitle({ title }: { title?: string }) {
  const t = useTranslate();

  return (
    <Helmet>
      <title>{t('documentTitle', { prefix: title })}</title>
    </Helmet>
  );
}
