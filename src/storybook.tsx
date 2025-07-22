/* eslint-disable react-refresh/only-export-components */

type NumberOptions = Partial<Record<'min' | 'max' | 'step', number>>;

export const controls = {
  exclude: (values: string[]) => ({
    exclude: values,
  }),

  boolean: () => ({
    control: 'boolean' as const,
  }),

  number: (options: NumberOptions = {}) => ({
    control: { type: 'number' as const, ...options },
  }),

  range: (options: NumberOptions = {}) => ({
    control: { type: 'range' as const, ...options },
  }),

  string: () => ({
    control: 'text' as const,
  }),

  inlineRadio: <Options extends string | number = string>(options: Options[]) => ({
    control: 'inline-radio' as const,
    options,
  }),

  hidden: () => ({
    table: { disable: true },
  }),
};

export function ComponentPlaceholder() {
  return <div className="min-h-4 min-w-8 border border-dashed border-zinc-400" />;
}
