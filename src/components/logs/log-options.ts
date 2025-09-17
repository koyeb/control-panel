import { z } from 'zod';

export type LogOptions = {
  fullScreen: boolean;
  tail: boolean;
  stream: boolean;
  date: boolean;
  instance: boolean;
  wordWrap: boolean;
};

const schema = z.object({
  stream: z.boolean(),
  date: z.boolean(),
  instance: z.boolean(),
  wordWrap: z.boolean(),
});

const defaultOptions: LogOptions = {
  fullScreen: false,
  tail: true,
  stream: false,
  date: false,
  instance: false,
  wordWrap: false,
};

export function getInitialLogOptions(): LogOptions {
  return {
    ...defaultOptions,
    ...getStoredOptions(),
  };
}

function getStoredOptions(): Partial<LogOptions> {
  const value = localStorage.getItem('logs');

  try {
    const result = schema.safeParse(JSON.parse(value ?? '{}'));

    if (result.success) {
      return result.data;
    }
  } catch {
    //
  }

  return {};
}
