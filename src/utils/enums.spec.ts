import { describe, expect, expectTypeOf, it } from 'vitest';

import { enumIndex, isEnumValue } from './enums';

describe('enums', () => {
  enum Test {
    one = 'one',
    two = 'two',
  }

  describe('isEnumValue', () => {
    const isTest = isEnumValue(Test);

    it("returns true when a value is part of an enum's values", () => {
      expect(isTest(Test.one)).toBe(true);
      expect(isTest('one')).toBe(true);
    });

    it("returns false when a value is not part of an enum's values", () => {
      expect(isTest(undefined)).toBe(false);
      expect(isTest('three')).toBe(false);
    });

    it("asserts the parameter's type", () => {
      const value: unknown = Test.one;

      expectTypeOf<typeof value>().not.toEqualTypeOf<Test>();

      if (isTest(value)) {
        expectTypeOf<typeof value>().toEqualTypeOf<Test>();
      }
    });
  });

  describe('enumIndex', () => {
    const getIndex = enumIndex(Test);

    it("returns an enum value's index", () => {
      expect(getIndex(Test.one)).toBe(0);
    });

    it('returns -1 when the value is not part of the enum', () => {
      expect(getIndex(undefined as never)).toBe(-1);
    });
  });
});
