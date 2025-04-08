import { describe, expect, test } from 'vitest';

import { formatBytes, parseBytes } from './memory';

// cSpell: words kibibyte mebibyte gibibyte tebibyte

describe('parseBytes', () => {
  test('empty string', () => {
    expect(parseBytes('')).toBeNaN();
  });

  test('invalid input', () => {
    expect(parseBytes('hello')).toBeNaN();
    expect(parseBytes('0')).toBeNaN();
    expect(parseBytes('12')).toBeNaN();
    expect(parseBytes('12PB')).toBeNaN();
  });

  test('byte value', () => {
    expect(parseBytes('12B')).toBe(12);
  });

  test('kilobyte value', () => {
    expect(parseBytes('12KB')).toBe(12000);
  });

  test('kibibyte value', () => {
    expect(parseBytes('12KiB')).toBe(12288);
  });

  test('megabyte value', () => {
    expect(parseBytes('12MB')).toBe(12000000);
  });

  test('mebibyte value', () => {
    expect(parseBytes('12MiB')).toBe(12582912);
  });

  test('gigabyte value', () => {
    expect(parseBytes('12GB')).toBe(12000000000);
  });

  test('gibibyte value', () => {
    expect(parseBytes('12GiB')).toBe(12884901888);
  });

  test('terabyte value', () => {
    expect(parseBytes('12TB')).toBe(12000000000000);
  });

  test('tebibyte value', () => {
    expect(parseBytes('12TiB')).toBe(13194139533312);
  });

  test('space between value and unit', () => {
    expect(parseBytes('12 B')).toBe(12);
  });
});

describe('formatBytes', () => {
  test('zero', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  test('byte value', () => {
    expect(formatBytes(12)).toBe('12 B');
  });

  test('kibibyte value', () => {
    expect(formatBytes(12288)).toBe('12 KiB');
  });

  test('kilobyte value', () => {
    expect(formatBytes(12000, { decimal: true })).toBe('12 KB');
  });

  test('fractional kilobyte value', () => {
    expect(formatBytes(12012, { decimal: true })).toBe('12.012 KB');
  });

  test('rounded kilobyte value', () => {
    expect(formatBytes(12012, { decimal: true, round: true })).toBe('12 KB');
  });
});
