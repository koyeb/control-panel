import { useCallback } from 'react';
import { IntlShape, useIntl } from 'react-intl';

import { Trim } from 'src/utils/types';

export type TranslationsObject = {
  [Key in string]: string | TranslationsObject;
};

type Values = Parameters<IntlShape['formatMessage']>[1];

type Prefixes<Key extends string> = (Key extends `${infer P}.${infer S}`
  ? [P, `${P}.${Prefixes<S>}`]
  : [Key])[number];

export interface TranslateFunction<Key extends string> {
  (id: Key): string;
  (id: Key, values: Values): string | JSX.Element;
}

export function createTranslationHelpers<Key extends string>(commonValues?: Values) {
  function useTranslate() {
    const intl = useIntl();

    const translate = useCallback(
      (id: string, values?: Values) => {
        return intl.formatMessage({ id }, { ...commonValues, ...values });
      },
      [intl],
    );

    return translate as TranslateFunction<Key>;
  }

  type TranslateProps<Key extends string> = {
    id: Key;
    values?: Values;
  };

  function Translate(props: TranslateProps<Key>) {
    const translate = useTranslate();

    return translate(props.id, props.values);
  }

  Translate.prefix = <P extends Prefixes<Key>>(prefix: P) => {
    type SubKey = Trim<Key, `${P}.`>;
    type Props = TranslateProps<SubKey>;

    const getId = (id: SubKey) => {
      return `${prefix}.${id}` as Key;
    };

    const T = (props: Props) => {
      return <Translate id={getId(props.id)} values={props.values} />;
    };

    T.useTranslate = () => {
      const t = useTranslate();

      const translate = useCallback(
        (id: SubKey, values: Values) => {
          return t(getId(id), values);
        },
        [t],
      );

      return translate as TranslateFunction<SubKey>;
    };

    return T;
  };

  return {
    useTranslate,
    Translate,
  };
}
