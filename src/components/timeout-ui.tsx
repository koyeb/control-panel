import { useEffect, useState } from 'react';

type TimeoutUiProps = {
  timeout: number;
  beforeTimeout: React.ReactNode;
  afterTimeout: React.ReactNode;
};

export function TimeoutUi({ timeout, beforeTimeout, afterTimeout }: TimeoutUiProps) {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setTimedOut(true), timeout);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [timeout]);

  return !timedOut ? beforeTimeout : afterTimeout;
}
