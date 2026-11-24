import { describe, expect, test } from 'vitest';

import { databaseRoleSecret } from './use-submit-database-service-form';

describe('databaseRoleSecret', () => {
  test('plain name', () => {
    expect(databaseRoleSecret('database', 'abc')).toEqual('database-abc');
  });

  test('name with a dot', () => {
    expect(databaseRoleSecret('developer.database', 'abc')).toEqual('developer-database-abc');
  });

  test('name starting with a digit', () => {
    expect(databaseRoleSecret('1db', 'abc')).toEqual('_1db-abc');
  });

  test('long name keeps the suffix within 64 chars', () => {
    expect(databaseRoleSecret('a'.repeat(63), 'abc')).toEqual(`${'a'.repeat(60)}-abc`);
  });

  test('generated name is a valid secret name', () => {
    expect(databaseRoleSecret('developer.database')).toMatch(/^[a-zA-Z_][a-zA-Z0-9-_]{1,63}$/);
  });
});
