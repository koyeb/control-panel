import { beforeEach, describe, expect, it, vi } from 'vitest';

import { wait, waitFor } from './promises';

describe('promises', () => {
  describe('wait', () => {
    it('waits for a promise to resolve', async () => {
      const done = vi.fn();

      async function fn() {
        await wait(10);
        done();
      }

      await fn();

      expect(done).toHaveBeenCalled();
    });

    it('aborts waiting for a promise to resolve', async () => {
      const abort = new AbortController();
      const done = vi.fn();

      async function fn() {
        await wait(10, abort.signal);
        done();
      }

      const promise = fn();
      abort.abort();
      await promise;

      expect(done).toHaveBeenCalled();
    });
  });

  describe('waitFor', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('waits for a predicate', async () => {
      const predicate = vi.fn().mockResolvedValue(false);

      const promise = waitFor(predicate);

      await Promise.resolve();
      expect(predicate).toHaveBeenCalledTimes(1);

      vi.runAllTimers();
      await Promise.resolve();
      await Promise.resolve();

      expect(predicate).toHaveBeenCalledTimes(2);

      predicate.mockResolvedValue(true);
      vi.runAllTimers();

      await expect(promise).resolves.toBe(true);
    });
  });

  it('times out waiting for a predicate', async () => {
    const promise = waitFor(() => false, { timeout: 2 * 1000 });

    await Promise.resolve();

    vi.runAllTimers();
    await Promise.resolve();
    await Promise.resolve();

    vi.runAllTimers();

    await expect(promise).resolves.toBe(false);
  });
});
