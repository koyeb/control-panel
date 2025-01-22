export type ValueOf<T> = T[keyof T];

export type Trim<Str, P extends string> = Str extends `${P}${infer S}` ? S : never;

export type TrimObjectKeys<T, P extends string> = {
  [K in Trim<keyof T, P>]: T[Extract<keyof T, `${P}${K}`>];
};

export type DeepPartial<T> = {
  [Key in keyof T]?: T[Key] extends object ? DeepPartial<T[Key]> : T[Key];
};

export type Get<T, K> =
  T extends Record<string, unknown>
    ? K extends `${infer P}.${infer S}`
      ? Get<Extract<T[P], Record<string, unknown>>, S>
      : K extends keyof T
        ? T[K]
        : never
    : never;

export type Paths<T> = ValueOf<{
  [Key in keyof T as string]: T[Key] extends object
    ? `${Extract<Key, string>}.${Extract<Paths<T[Key]>, string>}`
    : Key;
}>;

export type Flatten<T> = {
  [Key in Extract<Paths<T>, string>]: Get<T, Key>;
};

export type Extend<T, U> = Omit<T, keyof U> & U;
