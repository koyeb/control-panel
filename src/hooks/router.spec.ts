import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useLocation, useNavigate } from './router';

describe('router', () => {
  const pushState = vi.fn();

  function url(url: string) {
    return new URL(url, 'http://localhost:3000');
  }

  beforeEach(() => {
    window.location.href = '/';

    pushState.mockReset();
    history.pushState = pushState;
  });

  describe('useLocation', () => {
    it('returns the current location', () => {
      window.location.href = '/some/route';
      const { result } = renderHook(() => useLocation());

      expect(result.current).toEqual('/some/route');
    });

    it('returns the current location with search params', () => {
      window.location.href = '/some/route';
      window.location.search = 'some=param';
      const { result } = renderHook(() => useLocation());

      expect(result.current).toEqual('/some/route?some=param');
    });
  });

  describe('useNavigate', () => {
    it('navigates to a given URL string', () => {
      const { result } = renderHook(() => useNavigate());

      result.current('/some/route');

      expect(pushState).toHaveBeenCalledWith(null, '', '/some/route');
    });

    it('navigates to a given URL object', () => {
      const { result } = renderHook(() => useNavigate());

      result.current(url('/some/route'));

      expect(pushState).toHaveBeenCalledWith(null, '', url('/some/route'));
    });

    it('navigates by returning an URL object', () => {
      const { result } = renderHook(() => useNavigate());

      result.current(() => url('/some/route'));

      expect(pushState).toHaveBeenCalledWith(null, '', url('/some/route'));
    });

    it('navigates by mutating an URL object', () => {
      const { result } = renderHook(() => useNavigate());

      result.current((url) => {
        url.pathname = '/some/route';
      });

      expect(pushState).toHaveBeenCalledWith(null, '', url('/some/route'));
    });
  });
});
