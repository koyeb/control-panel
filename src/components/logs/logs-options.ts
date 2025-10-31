import { useForm } from 'react-hook-form';
import { z } from 'zod';

export type LogsOptions = {
  fullScreen: boolean;
  tail: boolean;
  stream: boolean;
  date: boolean;
  instance: boolean;
  wordWrap: boolean;
  interpretAnsi: boolean;
};

const defaultOptions: LogsOptions = {
  fullScreen: false,
  tail: true,
  stream: false,
  date: false,
  instance: false,
  wordWrap: false,
  interpretAnsi: true,
};

export function useLogsOptions() {
  return useForm<LogsOptions>({
    defaultValues: async () => ({
      ...defaultOptions,
      ...getStoredOptions(),
    }),
  });
}

const schema = z.object({
  stream: z.boolean(),
  date: z.boolean(),
  instance: z.boolean(),
  wordWrap: z.boolean(),
});

function getStoredOptions(): Partial<LogsOptions> {
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
