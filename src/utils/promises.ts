export function wait(ms = 1000, abort?: AbortSignal) {
  return new Promise<boolean>((resolve) => {
    const timeout = setTimeout(() => resolve(true), ms);

    if (abort) {
      abort.addEventListener('abort', () => {
        clearTimeout(timeout);
        resolve(false);
      });
    }
  });
}

type WaitForOptions = {
  timeout?: number;
  interval?: number;
  signal?: AbortSignal;
};

export async function waitFor(
  predicate: () => boolean | Promise<boolean>,
  { timeout = Infinity, interval = 1000, signal }: WaitForOptions = {},
) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    if (await predicate()) {
      return true;
    }

    await wait(interval, signal);
  }

  return false;
}
