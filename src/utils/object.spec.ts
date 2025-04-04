import { describe, expect, expectTypeOf, it, vi } from 'vitest';

import { identity } from './generic';
import { entries, keys, snakeToCamelDeep, toObject, trackChanges } from './object';

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

  describe('trackChanges', () => {
    it('track changes on an object', () => {
      const onChange = vi.fn();
      const proxy = trackChanges<{ foo: number; bar: number; baz?: number }>({ foo: 1, bar: 2 }, onChange);

      proxy.foo = 3;
      proxy.baz = 4;

      expect(proxy).toEqual({ foo: 3, bar: 2, baz: 4 });

      expect(onChange).toHaveBeenCalledTimes(2);
      expect(onChange).toHaveBeenCalledWith('foo', 3);
      expect(onChange).toHaveBeenCalledWith('baz', 4);
    });

    it('track changes on sub properties', () => {
      const onChange = vi.fn();
      const proxy = trackChanges<{ foo: { bar: number } }>({ foo: { bar: 1 } }, onChange);

      proxy.foo.bar = 2;

      expect(proxy).toEqual({ foo: { bar: 2 } });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('foo.bar', 2);
    });

    it('does not invoke the callback when the value does not change', () => {
      const onChange = vi.fn();
      const proxy = trackChanges({ foo: 1 }, onChange);

      proxy.foo = 1;

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('snakeToCamelCaseDeep', () => {
    it('empty object', () => {
      expect(snakeToCamelDeep({})).toEqual({});
    });

    it('one level object', () => {
      expect(snakeToCamelDeep({ foo_bar: '' })).toEqual({ fooBar: '' });
    });

    it('nested objects', () => {
      expect(snakeToCamelDeep({ foo_bar: { baz_qux: '' } })).toEqual({ fooBar: { bazQux: '' } });
    });
  });
});
