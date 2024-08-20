import { routes } from 'src/application/routes';
import { Link } from 'src/components/link';

import type translations from './en.json';
import {
  TranslateFunction as TranslateFunctionHelper,
  TranslationKeys as TranslationKeysHelper,
  createTranslationHelpers,
} from './translation-helpers';

export type TranslationKeys = TranslationKeysHelper<typeof translations>;
export type TranslateFunction = TranslateFunctionHelper<TranslationKeys>;

export const { Translate, useTranslate } = createTranslationHelpers<typeof translations>({
  strong: (children) => <strong>{children}</strong>,
  code: (children) => <code>{children}</code>,
  dim: (children) => <span className="text-dim">{children}</span>,
  upgrade: (children) => (
    <Link href={routes.organizationSettings.plans()} className="text-link">
      {children}
    </Link>
  ),
});
