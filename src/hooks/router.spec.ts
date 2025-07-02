import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useLocation, useNavigate } from './router';

describe('router', () => {
  const pushState = vi.fn();

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
    it('navigates to a given URL', () => {
      const { result } = renderHook(() => useNavigate());

      result.current({ to: '/some/route' });

      expect(pushState).toHaveBeenCalledWith(null, '', '/some/route');
    });

    it('navigates to a given set of search params', () => {
      window.location.search = 'some=param';
      const { result } = renderHook(() => useNavigate());

      result.current({
        search: {
          foo: 'bar',
        },
      });

      expect(pushState).toHaveBeenCalledWith(null, '', '/?foo=bar');
    });

    it('navigates by mutating the search params', () => {
      window.location.search = 'some=param';
      const { result } = renderHook(() => useNavigate());

      result.current({
        search: () => ({
          foo: 'bar',
        }),
      });

      expect(pushState).toHaveBeenCalledWith(null, '', '/?foo=bar');
    });

    it('removes a search param', () => {
      window.location.search = 'some=param';
      const { result } = renderHook(() => useNavigate());

      result.current({
        search: () => ({
          some: null,
        }),
      });

      expect(pushState).toHaveBeenCalledWith(null, '', '/');
    });
  });
});
