import { Simplify } from 'type-fest';
import { describe, expectTypeOf, it } from 'vitest';

import { Flatten, SnakeToCamelCase, SnakeToCamelCaseDeep, Trim, TrimObjectKeys } from './types';

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

  describe('snakeToCamelCase', () => {
    it('transforms a snake cased string to camel case', () => {
      expectTypeOf<SnakeToCamelCase<'my_string'>>().toEqualTypeOf<'myString'>();
      expectTypeOf<SnakeToCamelCase<'my_other_string'>>().toEqualTypeOf<'myOtherString'>();
    });

    it('one level object', () => {
      expectTypeOf<SnakeToCamelCaseDeep<{ foo: '' }>>().toEqualTypeOf<{ foo: '' }>();
      expectTypeOf<SnakeToCamelCaseDeep<{ my_key: '' }>>().toEqualTypeOf<{ myKey: '' }>();
    });

    it('nested object', () => {
      expectTypeOf<SnakeToCamelCaseDeep<{ first_level: { second_level: '' } }>>().toEqualTypeOf<{
        firstLevel: { secondLevel: '' };
      }>();
    });
  });
});
