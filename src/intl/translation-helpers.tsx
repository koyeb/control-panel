import { IntlShape, useIntl } from 'react-intl';

type Prefixes<Key extends string> = Key extends `${infer P}.${infer S}` ? P | `${P}.${Prefixes<S>}` : never;
type Values = Parameters<IntlShape['formatMessage']>[1];

export interface TranslateFunction<Key extends string> {
  (id: Key): string;
  (id: Key, values: Values): string | React.ReactNode;
}

export function createTranslationHelper<Key extends string>(commonValues: Values = {}) {
  function useTranslate<Prefix extends Prefixes<Key>>(prefix: Prefix) {
    type Suffix = Key extends `${Prefix}.${infer S}` ? S : never;

    const intl = useIntl();

    function translate(suffix: Suffix): string;
    function translate(suffix: Suffix, values: Values): string | React.ReactNode[];

    function translate(suffix: string, values?: Values): string | React.ReactNode[] {
      const id = prefix === '' ? suffix : `${prefix}.${suffix}`;
      return intl.formatMessage({ id }, { ...values, ...commonValues });
    }

    return translate;
  }

  return function <Prefix extends Prefixes<Key>>(prefix: Prefix) {
    type Id = Key extends `${Prefix}.${infer S}` ? S : never;

    function Translate(props: { id: Id; values?: Values }) {
      const translate = useTranslate(prefix);
      return <>{translate(props.id, props.values ?? {})}</>;
    }

    Translate.useTranslate = () => useTranslate<Prefix>(prefix);

    return Translate;
  };
}
