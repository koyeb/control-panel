import { describe, expect, it, test } from 'vitest';

import { dotenvParse } from './dotenv';

describe('dotenvParse', () => {
  test('no value', () => {
    expect(dotenvParse('')).toEqual({});
  });

  test('one line', () => {
    const input = ['PORT=8000'].join('\n');

    expect(dotenvParse(input)).toEqual({ PORT: '8000' });
  });

  test('multiple lines', () => {
    const input = ['PORT=8000', 'HOST=localhost'].join('\n');

    expect(dotenvParse(input)).toEqual({ PORT: '8000', HOST: 'localhost' });
  });

  test('variable starting with spaces', () => {
    const input = ['  PORT=8000'].join('\n');

    expect(dotenvParse(input)).toEqual({ PORT: '8000' });
  });

  test('variable with equal sign in value', () => {
    const input = ['TEST=abc=123'].join('\n');

    expect(dotenvParse(input)).toEqual({ TEST: 'abc=123' });
  });

  test('empty lines', () => {
    const input = ['', 'PORT=8000', '', '  ', 'HOST=localhost', ''].join('\n');

    expect(dotenvParse(input)).toEqual({ PORT: '8000', HOST: 'localhost' });
  });

  test('lines starting with #', () => {
    const input = ['# production', 'PORT=8000', '#', '  #', 'HOST=localhost', '#KEY=value'].join('\n');

    expect(dotenvParse(input)).toEqual({ PORT: '8000', HOST: 'localhost' });
  });

  it('handles quotes in values', () => {
    const input = [`KEY=I'm not a "cat"`].join('\n');

    expect(dotenvParse(input)).toEqual({ KEY: `I'm not a "cat"` });
  });

  it('handles multiline values', () => {
    const value = ['-----BEGIN RSA PRIVATE KEY-----', '...', '-----END RSA PRIVATE KEY-----'].join('\n');
    const input = [`CERT="${value}"`].join('\n');

    expect(dotenvParse(input)).toEqual({ CERT: value });
  });
});
