export type Extend<T, U> = Omit<T, keyof U> & U;
