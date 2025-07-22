import { beforeEach, describe, expect, test, vi } from 'vitest';

import { TOKENS } from 'src/tokens';

import { StubConfigAdapter } from './config';
import { container } from './container';
import { setCookie } from './cookies';

describe('cookies', () => {
  const config = new StubConfigAdapter();

  beforeEach(() => {
    container.bindValue(TOKENS.config, config);
  });

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
      config.set('environment', 'production');

      setCookie('name', 'value');
      expect(cookie).toHaveBeenCalledWith('name=value;Domain=app.koyeb.com');
    });
  });
});
