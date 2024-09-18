import { beforeEach, describe, expect, it, test } from 'vitest';

import { EnvironmentVariable } from 'src/api/model';
import { create } from 'src/utils/factories';

import {
  SecretNotFoundError,
  parseEnvironmentVariables,
  stringifyEnvironmentVariables,
} from './parse-environment-variables';

describe('parseEnvironmentVariables', () => {
  let port: EnvironmentVariable;
  let host: EnvironmentVariable;

  beforeEach(() => {
    port = create.environmentVariable({
      name: 'PORT',
      value: '8000',
      type: 'plaintext',
    });

    host = create.environmentVariable({
      name: 'HOST',
      value: 'localhost',
      type: 'plaintext',
    });
  });

  test('no variables', () => {
    expect(parseEnvironmentVariables('', [])).toEqual([]);
  });

  test('one variable', () => {
    const input = ['PORT=8000'].join('\n');

    expect(parseEnvironmentVariables(input, [])).toEqual([port]);
  });

  test('multiple variables', () => {
    const input = ['PORT=8000', 'HOST=localhost'].join('\n');

    expect(parseEnvironmentVariables(input, [])).toEqual([port, host]);
  });

  test('variable starting with spaces', () => {
    const input = ['  PORT=8000'].join('\n');

    expect(parseEnvironmentVariables(input, [])).toEqual([port]);
  });

  test('variable with equal sign in value', () => {
    const input = ['TEST=abc=123'].join('\n');

    expect(parseEnvironmentVariables(input, [])).toEqual([
      create.environmentVariable({
        name: 'TEST',
        type: 'plaintext',
        value: 'abc=123',
      }),
    ]);
  });

  test('empty lines', () => {
    const input = ['', 'PORT=8000', '', '  ', 'HOST=localhost', ''].join('\n');

    expect(parseEnvironmentVariables(input, [])).toEqual([port, host]);
  });

  test('lines starting with #', () => {
    const input = ['# production', 'PORT=8000', '#', '  #', 'HOST=localhost', '#KEY=value'].join('\n');

    expect(parseEnvironmentVariables(input, [])).toEqual([port, host]);
  });

  test('secrets', () => {
    const input = ['TOKEN=@api-token'].join('\n');

    const token = create.environmentVariable({
      name: 'TOKEN',
      value: 'api-token',
      type: 'secret',
    });

    const tokenSecret = create.simpleSecret({ name: 'api-token' });

    expect(parseEnvironmentVariables(input, [tokenSecret])).toEqual([token]);
  });

  test('throws an error when the secrets does not exist', () => {
    const input = ['TOKEN=@token-api'].join('\n');
    const tokenSecret = create.simpleSecret({ name: 'api-token' });

    expect(() => parseEnvironmentVariables(input, [tokenSecret])).toThrow(SecretNotFoundError);
  });

  it('handles quoted values', () => {
    const input = ['KEY=I\'m not a "cat"'].join('\n');

    expect(parseEnvironmentVariables(input, [])).toEqual([
      {
        name: 'KEY',
        value: 'I\'m not a "cat"',
        type: 'plaintext',
      },
    ]);
  });

  it('handles multiline values', () => {
    const value = ['-----BEGIN RSA PRIVATE KEY-----', '...', '-----END RSA PRIVATE KEY-----'].join('\n');
    const input = [`CERT="${value}"`].join('\n');

    expect(parseEnvironmentVariables(input, [])).toEqual([
      {
        name: 'CERT',
        value,
        type: 'plaintext',
      },
    ]);
  });
});

describe('stringifyEnvironmentVariables', () => {
  test('empty array', () => {
    expect(stringifyEnvironmentVariables([])).toEqual('');
  });

  test('multiple environment variables', () => {
    const port = create.environmentVariable({
      name: 'PORT',
      value: '8000',
      type: 'plaintext',
    });

    const host = create.environmentVariable({
      name: 'HOST',
      value: 'localhost',
      type: 'plaintext',
    });

    expect(stringifyEnvironmentVariables([host, port])).toEqual('HOST=localhost\nPORT=8000\n');
  });

  test('skip empty names', () => {
    const variable = create.environmentVariable({
      name: '',
      value: '',
      type: 'plaintext',
    });

    expect(stringifyEnvironmentVariables([variable])).toEqual('');
  });

  test('secrets', () => {
    const token = create.environmentVariable({
      name: 'TOKEN',
      value: 'api-token',
      type: 'secret',
    });

    expect(stringifyEnvironmentVariables([token])).toEqual('TOKEN=@api-token\n');
  });

  test('multiline value', () => {
    const token = create.environmentVariable({
      name: 'TOKEN',
      value: 'hello\nworld',
      type: 'plaintext',
    });

    expect(stringifyEnvironmentVariables([token])).toEqual('TOKEN="hello\nworld"\n');
  });

  test('multiline value with double quotes', () => {
    const token = create.environmentVariable({
      name: 'TOKEN',
      value: 'hello\n"world"',
      type: 'plaintext',
    });

    expect(stringifyEnvironmentVariables([token])).toEqual('TOKEN=\'hello\n"world"\'\n');
  });

  test('multiline value with single and double quotes', () => {
    const token = create.environmentVariable({
      name: 'TOKEN',
      value: 'hello\n"\'world\'"',
      type: 'plaintext',
    });

    expect(stringifyEnvironmentVariables([token])).toEqual('TOKEN=`hello\n"\'world\'"`\n');
  });
});
