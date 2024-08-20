import { IntlProvider as ReactIntlProvider } from 'react-intl';

import en from './en.json';

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
