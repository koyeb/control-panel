import { describe, expect, it } from 'vitest';

import { identity } from './generic';

describe('generic', () => {
  describe('identity', () => {
    it('returns the value given as parameter', () => {
      expect(identity(42)).toEqual(42);
    });
  });
});
