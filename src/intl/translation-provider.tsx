import { IntlProvider as ReactIntlProvider, createIntl, createIntlCache } from 'react-intl';

import en from './en.json';
import { TranslateFn, TranslateValues, TranslationKeys } from './translate';

type IntlProviderProps = {
  children: React.ReactNode;
};

export function IntlProvider({ children }: IntlProviderProps) {
  return (
    <ReactIntlProvider locale="en" messages={flatten(en)}>
      {children}
    </ReactIntlProvider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function createTranslateFn(): TranslateFn {
  const intl = createIntl(
    {
      locale: 'en',
      messages: flatten(en),
    },
    createIntlCache(),
  );

  function translate(id: TranslationKeys): string;
  function translate(id: TranslationKeys, values: TranslateValues): React.ReactNode[];

  function translate(id: TranslationKeys, values?: TranslateValues): string | React.ReactNode[] {
    return intl.formatMessage({ id }, values);
  }

  return translate;
}

function flatten(obj: object, prefix = '') {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[`${prefix !== '' ? `${prefix}.` : ''}${key}`] = value;
    } else if (typeof value === 'object' && value !== null) {
      Object.assign(result, flatten(value as object, `${prefix}.${key}`.replace(/^\./, '')));
    } else {
      throw new Error(`Cannot flatten value of type "${typeof value}"`);
    }
  }

  return result;
}
