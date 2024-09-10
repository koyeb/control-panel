import { routes } from 'src/application/routes';
import { Link } from 'src/components/link';
import { Flatten } from 'src/utils/types';

import type translations from './en.json';
import { TranslateFunction, createTranslationHelpers } from './translation-helpers';

export type TranslationKeys = keyof Flatten<typeof translations>;
export type TranslateFn = TranslateFunction<TranslationKeys>;

export const { Translate, useTranslate } = createTranslationHelpers<TranslationKeys>({
  strong: (children) => <strong>{children}</strong>,
  code: (children) => <code>{children}</code>,
  dim: (children) => <span className="text-dim">{children}</span>,
  upgrade: (children) => (
    <Link href={routes.organizationSettings.plans()} className="text-link">
      {children}
    </Link>
  ),
});
