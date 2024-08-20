import { beforeEach, describe, expect, test, vi } from 'vitest';

import { setCookie } from './cookies';

describe('cookies', () => {
  describe('setCookie', () => {
    const cookie = vi.fn();

    beforeEach(() => {
      Object.defineProperty(document, 'cookie', {
        set: cookie,
      });
    });

    test('no options', () => {
      setCookie('name', 'value');
      expect(cookie).toHaveBeenCalledWith('name=value');
    });

    test('string options', () => {
      setCookie('name', 'value', { Path: '/' });
      expect(cookie).toHaveBeenCalledWith('name=value;Path=/');
    });

    test('boolean options', () => {
      setCookie('name', 'value', { Secure: true, HttpOnly: false });
      expect(cookie).toHaveBeenCalledWith('name=value;Secure');
    });

    test('domain', () => {
      vi.stubEnv('VITE_ENVIRONMENT', 'production');
      setCookie('name', 'value');
      expect(cookie).toHaveBeenCalledWith('name=value;Domain=app.koyeb.com');
    });
  });
});
