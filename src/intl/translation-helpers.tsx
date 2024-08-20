import { useCallback } from 'react';
import { IntlShape, useIntl } from 'react-intl';
import { Paths } from 'type-fest';

type PathsAsString<T> = Paths<T> extends string ? Paths<T> : never;

type RemovePrefix<T extends string, P extends string> = T extends `${P}${infer R}` ? R : never;

type LastPart<T extends string> = T extends `${string}.${infer Tail}` ? LastPart<Tail> : T;

type RemoveLastPart<T extends string> = T extends `${infer Head}.${LastPart<T>}` ? Head : '';

type NonLeavePaths<T extends string> = Exclude<RemoveLastPart<T>, ''>;

type LeavesFromPaths<P extends string> = {
  [K in P]: K extends NonLeavePaths<P> ? never : K;
}[P];

type Leaves<T> = LeavesFromPaths<PathsAsString<T>>;

export type TranslationsObject = {
  [Key in string]: string | TranslationsObject;
};

type Values = Parameters<IntlShape['formatMessage']>[1];

export interface TranslateFunction<Keys> {
  (id: Keys): string;
  (id: Keys, values: Values): string | JSX.Element;
}

export type TranslationKeys<Keys> = Leaves<Keys>;

export function createTranslationHelpers<Translations extends TranslationsObject>(commonValues?: Values) {
  function useTranslate() {
    const intl = useIntl();

    const translate = useCallback(
      (id: string, values?: Values) => {
        return intl.formatMessage({ id }, { ...commonValues, ...values });
      },
      [intl],
    );

    return translate as TranslateFunction<Leaves<Translations>>;
  }

  type TranslateProps<Keys extends string> = {
    id: Keys;
    values?: Values;
  };

  function Translate(props: TranslateProps<Leaves<Translations>>) {
    const translate = useTranslate();

    return translate(props.id, props.values);
  }

  Translate.prefix = <Prefix extends NonLeavePaths<PathsAsString<Translations>>>(prefix: Prefix) => {
    const getId = (id: string) => {
      return `${prefix}.${id}` as Leaves<Translations>;
    };

    type Keys = RemovePrefix<Leaves<Translations>, `${Prefix}.`>;
    type Props = TranslateProps<Keys>;

    const T = (props: Props) => {
      return <Translate id={getId(props.id)} values={props.values} />;
    };

    T.useTranslate = () => {
      const t = useTranslate();

      const translate = useCallback(
        (id: Keys, values: Values) => {
          return t(getId(id), values);
        },
        [t],
      );

      return translate as TranslateFunction<Keys>;
    };

    return T;
  };

  return {
    useTranslate,
    Translate,
  };
}
