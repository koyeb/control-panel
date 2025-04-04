import { describe, expect, test } from 'vitest';

import { createArray } from './arrays';
import { capitalize, isSlug, slugify, snakeToCamelCase } from './strings';

describe('slugify', () => {
  test('empty string', () => {
    expect(slugify('')).toEqual('');
  });

  test('alphanumeric string', () => {
    expect(slugify('hello123')).toEqual('hello123');
  });

  test('string with uppercase characters', () => {
    expect(slugify('hEllO')).toEqual('hello');
  });

  test('string with hyphens', () => {
    expect(slugify('hello-the-world')).toEqual('hello-the-world');
  });

  test('string with non-alphanumeric characters', () => {
    expect(slugify('hello the,world')).toEqual('hello-the-world');
  });

  test('string with a leading non-alphanumeric characters', () => {
    expect(slugify('.hello')).toEqual('hello');
  });

  test('string with a trailing non-alphanumeric characters', () => {
    expect(slugify('hello!')).toEqual('hello');
  });

  test('string with multiple consecutive non-alphanumeric', () => {
    expect(slugify('hello the !? world')).toEqual('hello-the-world');
  });

  test('string of more than 63 characters', () => {
    const string = createArray(6, '1234567890').join('');

    expect(slugify(`${string}12345`)).toEqual(`${string}123`);
  });

  test('string of more than 63 characters and leading dash', () => {
    const string = createArray(6, '1234567890').join('');

    expect(slugify(`${string}12-4`)).toEqual(`${string}12`);
  });
});

describe('capitalize', () => {
  test('empty string', () => {
    expect(capitalize('')).toEqual('');
  });

  test('lowercase string', () => {
    expect(capitalize('hello')).toBe('Hello');
  });

  test('uppercase string', () => {
    expect(capitalize('HELLO')).toBe('HELLO');
  });

  test('capitalized string', () => {
    expect(capitalize('Hello')).toBe('Hello');
  });
});

describe('isSlug', () => {
  test('empty string', () => {
    expect(isSlug('')).toBe(true);
  });

  test('string matching slug format', () => {
    expect(isSlug('hello-world-01')).toBe(true);
  });

  test('string not matching slug format', () => {
    expect(isSlug('hello world 01')).toBe(false);
  });

  describe('snakeToCamelCase', () => {
    test('empty string', () => {
      expect(snakeToCamelCase('')).toEqual('');
    });

    test('single word', () => {
      expect(snakeToCamelCase('string')).toEqual('string');
    });

    test('two words', () => {
      expect(snakeToCamelCase('my_string')).toEqual('myString');
    });

    test('many words', () => {
      expect(snakeToCamelCase('ab_cd_e_fg')).toEqual('abCdEFg');
    });
  });
});
