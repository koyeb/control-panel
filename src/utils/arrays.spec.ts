import { describe, expect, expectTypeOf, it } from 'vitest';

import { createArray, inArray, unique } from './arrays';

describe('arrays', () => {
  describe('createArray', () => {
    it('creates an empty array', () => {
      expect(createArray(0, undefined)).toEqual([]);
    });

    it('creates an array of elements', () => {
      expect(createArray(2, true)).toEqual([true, true]);
    });

    it('creates an array using a creation function', () => {
      expect(createArray(2, (index) => index)).toEqual([0, 1]);
    });
  });

  describe('unique', () => {
    it('removes duplicated values from an array', () => {
      expect(unique([1, 2, 2, 4, 4, 4])).toEqual([1, 2, 4]);
    });

    it('removes duplicated values using a transformation function', () => {
      expect(unique([{ val: 1 }, { val: 1 }, { val: 2 }], (obj) => obj['val'])).toEqual([
        { val: 1 },
        { val: 2 },
      ]);
    });
  });

  describe('inArray', () => {
    it('returns true when an array contains a value', () => {
      expect(inArray(1, [0, 1, 2])).toBe(true);
    });

    it('returns false when an array does not contain a value', () => {
      expect(inArray(1, [0, 2])).toBe(false);
    });

    it("asserts the parameter's type", () => {
      const value: number = 1;

      expectTypeOf<typeof value>().not.toEqualTypeOf<1>();

      if (inArray(value, [1] as const)) {
        expectTypeOf<typeof value>().toEqualTypeOf<1>();
      }
    });
  });
});
