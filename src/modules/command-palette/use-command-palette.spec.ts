import { describe } from 'node:test';

import { act, renderHook } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { useCommandPalette } from './use-command-palette';

describe('command palette', () => {
  it('executes a synchronous command', () => {
    const { result } = renderHook(() => useCommandPalette());
    const execute = vi.fn();

    act(() => {
      result.current[1].registerCommand({
        id: 'id',
        group: 'group',
        label: 'label',
        keywords: [],
        execute,
      });
    });

    act(() => {
      result.current[1].execute();
    });

    expect(execute).toHaveBeenCalled();
  });

  it('executes an async command', () => {
    const { result } = renderHook(() => useCommandPalette());
    const execute = vi.fn().mockResolvedValue(undefined);

    act(() => {
      result.current[1].registerCommand({
        id: 'id',
        group: 'group',
        label: 'label',
        keywords: [],
        execute,
      });
    });

    act(() => {
      result.current[1].execute();
    });

    expect(execute).toHaveBeenCalled();
  });
});
