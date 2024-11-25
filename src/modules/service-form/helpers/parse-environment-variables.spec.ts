import { describe, expect, test } from 'vitest';

import { create } from 'src/utils/factories';

import { stringifyEnvironmentVariables } from './parse-environment-variables';

describe('stringifyEnvironmentVariables', () => {
  test('empty array', () => {
    expect(stringifyEnvironmentVariables([])).toEqual('');
  });

  test('multiple environment variables', () => {
    const port = create.environmentVariable({
      name: 'PORT',
      value: '8000',
    });

    const host = create.environmentVariable({
      name: 'HOST',
      value: 'localhost',
    });

    expect(stringifyEnvironmentVariables([host, port])).toEqual('HOST=localhost\nPORT=8000\n');
  });

  test('skip empty names', () => {
    const variable = create.environmentVariable({
      name: '',
      value: '',
    });

    expect(stringifyEnvironmentVariables([variable])).toEqual('');
  });

  test('secrets', () => {
    const token = create.environmentVariable({
      name: 'TOKEN',
      value: '{{ secret.api-token }}',
    });

    expect(stringifyEnvironmentVariables([token])).toEqual('TOKEN={{ secret.api-token }}\n');
  });

  test('multiline value', () => {
    const token = create.environmentVariable({
      name: 'TOKEN',
      value: 'hello\nworld',
    });

    expect(stringifyEnvironmentVariables([token])).toEqual('TOKEN="hello\nworld"\n');
  });

  test('multiline value with double quotes', () => {
    const token = create.environmentVariable({
      name: 'TOKEN',
      value: 'hello\n"world"',
    });

    expect(stringifyEnvironmentVariables([token])).toEqual('TOKEN=\'hello\n"world"\'\n');
  });

  test('multiline value with single and double quotes', () => {
    const token = create.environmentVariable({
      name: 'TOKEN',
      value: 'hello\n"\'world\'"',
    });

    expect(stringifyEnvironmentVariables([token])).toEqual('TOKEN=`hello\n"\'world\'"`\n');
  });
});
