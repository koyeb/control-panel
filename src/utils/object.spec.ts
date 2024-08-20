import { describe, expect, expectTypeOf, it } from 'vitest';

import { identity } from './generic';
import { entries, keys, toObject } from './object';

describe('object', () => {
  describe('keys', () => {
    it('returns an an empty array for an empty object', () => {
      expect(keys({})).toEqual([]);
    });

    it("returns an object's keys", () => {
      expect(keys({ foo: 42, bar: 51 })).toEqual(['foo', 'bar']);
    });

    it('returns an array correctly typed', () => {
      expectTypeOf(keys({ foo: 42, bar: 51 })).toEqualTypeOf<Array<'foo' | 'bar'>>();
    });
  });

  describe('entries', () => {
    it('returns an empty array for an empty object', () => {
      expect(entries({})).toEqual([]);
    });

    it('returns an array of key-value tuples', () => {
      expect(entries({ foo: 42, bar: 51 })).toEqual([
        ['foo', 42],
        ['bar', 51],
      ]);
    });

    it('returns an array correctly typed', () => {
      expectTypeOf(entries({ foo: 42, bar: 51 })).toEqualTypeOf<Array<['foo' | 'bar', number]>>();
    });
  });

  describe('toObject', () => {
    it('returns an empty object for an empty array', () => {
      expect(toObject([], identity, identity)).toEqual({});
    });

    it('transforms an array into an object', () => {
      expect(toObject([42], identity, identity)).toEqual({ 42: 42 });
    });

    it('provides function to create the key and the value', () => {
      const getKey = (item: string, index: number) => `key ${item} ${index}`;
      const getValue = (item: string, index: number) => `value ${item} ${index}`;

      expect(toObject(['foo'], getKey, getValue)).toEqual({ 'key foo 0': 'value foo 0' });
    });

    it('returns an object correctly typed', () => {
      expectTypeOf(toObject(['foo', 'bar'] as const, identity, () => 1 as const)).toEqualTypeOf<
        Record<'foo' | 'bar', 1>
      >();
    });
  });
});
