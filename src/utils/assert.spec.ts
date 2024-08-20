import { describe, expect, it } from 'vitest';

import { AssertionError, assert, defined } from './assert';

describe('assert', () => {
  it('does not throw when the condition is met', () => {
    expect(() => assert(true)).not.toThrow();
  });

  it('throws an AssertionError when the condition is not met', () => {
    expect(() => assert(false)).toThrow(AssertionError);
  });

  it('throws a custom AssertionError when provided', () => {
    expect(() => assert(false, new AssertionError('custom'))).toThrow('custom');
  });
});

describe('defined', () => {
  it('does not throw when the value is defined', () => {
    expect(() => defined(true)).not.toThrow();
    expect(() => defined(false)).not.toThrow();
    expect(() => defined(42)).not.toThrow();
    expect(() => defined(0)).not.toThrow();
    expect(() => defined('')).not.toThrow();
  });

  it('returns the value', () => {
    expect(defined(42)).toEqual(42);
  });

  it('throws when the value is null', () => {
    expect(() => defined(null)).toThrow(AssertionError);
  });

  it('throws when the value is undefined', () => {
    expect(() => defined(undefined)).toThrow(AssertionError);
  });

  it('throws a custom AssertionError when provided', () => {
    expect(() => defined(null, new AssertionError('custom'))).toThrow('custom');
  });
});
