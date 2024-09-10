import { Simplify } from 'type-fest';
import { describe, expectTypeOf, it } from 'vitest';

import { Flatten, Trim, TrimObjectKeys } from './types';

describe('types', () => {
  describe('trim', () => {
    it("trims a string's prefix", () => {
      expectTypeOf<Trim<'foobar', 'foo'>>().toEqualTypeOf<'bar'>();
    });

    it("removes a prefix from an object's keys", () => {
      expectTypeOf<TrimObjectKeys<{ foo: ''; 'foo.bar': '' }, 'foo.'>>().toEqualTypeOf<{ bar: '' }>();
    });
  });

  describe('flatten', () => {
    it('flattens an object on one level', () => {
      expectTypeOf<Simplify<Flatten<{ foo: ''; bar: true }>>>().toEqualTypeOf<{ foo: ''; bar: true }>();
    });

    it('flattens an object recursively', () => {
      type Obj = {
        foo: '';
        bar: {
          foo: 42;
          baz: '';
        };
      };

      expectTypeOf<Simplify<Flatten<Obj>>>().toEqualTypeOf<{ foo: ''; 'bar.foo': 42; 'bar.baz': '' }>();
    });
  });
});
