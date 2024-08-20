import { describe, expect, it, vi } from 'vitest';

import { wait } from './promises';

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
});
