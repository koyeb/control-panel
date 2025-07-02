import { IntlShape, useIntl } from 'react-intl';

import { routes } from 'src/application/routes';
import { Link } from 'src/components/link';
import { capitalize, lowerCase } from 'src/utils/strings';
import { Flatten } from 'src/utils/types';

import type translations from './en.json';
import { TranslateFunction, createTranslationHelper } from './translation-helpers';

/* eslint-disable react-refresh/only-export-components */

export type TranslationKeys = keyof Flatten<typeof translations>;
export type TranslateFn = TranslateFunction<TranslationKeys>;

export const createTranslate = createTranslationHelper<TranslationKeys>({
  br: () => <br />,
  strong: (children) => <strong>{children}</strong>,
  code: (children) => <code>{children}</code>,
  dim: (children) => <span className="text-dim">{children}</span>,
  upgrade: (children) => (
    <Link to={routes.organizationSettings.plans()} className="text-link">
      {children}
    </Link>
  ),
});

export type TranslateValues = Parameters<IntlShape['formatMessage']>[1];

export function useTranslate() {
  const intl = useIntl();

  function translate(id: TranslationKeys): string;
  function translate(id: TranslationKeys, values: TranslateValues): React.ReactNode[];

  function translate(id: TranslationKeys, values?: TranslateValues): string | React.ReactNode[] {
    return intl.formatMessage({ id }, values);
  }

  return translate;
}

export function Translate({ id, values }: { id: TranslationKeys; values?: TranslateValues }) {
  const translate = useTranslate();

  return <>{translate(id, values)}</>;
}

type EnumKeys = Extract<TranslationKeys, `enums.${string}.${string}`>;

type Enum = EnumKeys extends `enums.${infer E}.${string}` ? E : never;

type EnumValue<E extends Enum> =
  Extract<EnumKeys, `enums.${E}.${string}`> extends `enums.${E}.${infer V}` ? V : never;

export function TranslateEnum<E extends Enum>({ enum: enumName, value }: { enum: E; value: EnumValue<E> }) {
  return <Translate id={`enums.${enumName}.${value}` as TranslationKeys} />;
}

export function TranslateStatus({ status }: { status: string }) {
  return translateStatus(status);
}

export function translateStatus(status: string): string {
  return capitalize(lowerCase(status));
}
