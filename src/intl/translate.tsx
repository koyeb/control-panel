import { IntlShape, useIntl } from 'react-intl';

import { routes } from 'src/application/routes';
import { Link } from 'src/components/link';
import { Flatten } from 'src/utils/types';

import type translations from './en.json';
import { TranslateFunction, createTranslationHelper } from './translation-helpers';

/* eslint-disable react-refresh/only-export-components */

export type TranslationKeys = keyof Flatten<typeof translations>;
export type TranslateFn = TranslateFunction<TranslationKeys>;

export const createTranslate = createTranslationHelper<TranslationKeys>({
  strong: (children) => <strong>{children}</strong>,
  code: (children) => <code>{children}</code>,
  dim: (children) => <span className="text-dim">{children}</span>,
  upgrade: (children) => (
    <Link href={routes.organizationSettings.plans()} className="text-link">
      {children}
    </Link>
  ),
});

type Values = Parameters<IntlShape['formatMessage']>[1];

export function useTranslate() {
  const intl = useIntl();

  function translate(id: TranslationKeys): string;
  function translate(id: TranslationKeys, values: Values): React.ReactNode[];

  function translate(id: TranslationKeys, values?: Values): string | React.ReactNode[] {
    return intl.formatMessage({ id }, values);
  }

  return translate;
}

export function Translate({ id, values }: { id: TranslationKeys; values?: Values }) {
  const translate = useTranslate();

  return <>{translate(id, values)}</>;
}
