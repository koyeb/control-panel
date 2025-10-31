import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { StoredValue } from 'src/application/storage';

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

const storedOptions = new StoredValue('logs-options', {
  parse: parseOptions,
});

export function useLogsOptions() {
  const form = useForm<LogsOptions>({
    defaultValues: async () => ({
      ...defaultOptions,
      ...storedOptions.read(),
    }),
  });

  const watch = form.watch;

  useEffect(() => {
    const { unsubscribe } = watch(({ stream, date, instance, wordWrap, interpretAnsi }, { type }) => {
      if (type === 'change') {
        storedOptions.write({ stream, date, instance, wordWrap, interpretAnsi });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [watch]);

  return form;
}

const schema = z.object({
  stream: z.boolean(),
  date: z.boolean(),
  instance: z.boolean(),
  wordWrap: z.boolean(),
  interpretAnsi: z.boolean(),
});

function parseOptions(): Partial<LogsOptions> {
  const value = localStorage.getItem('logs-options');

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
