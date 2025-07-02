import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useLocation, useNavigate, useSearchParam } from './router';

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

  describe('useSearchParam', () => {
    it("retrieves a search param's value", () => {
      const { result, rerender } = renderHook(() => useSearchParam('name'));

      expect(result.current[0]).toBeNull();

      window.location.search = 'name=value';
      rerender();

      expect(result.current[0]).toEqual('value');
    });

    it("retrieves a search param's value as an array", () => {
      window.location.search = 'name=value1&name=value2';

      const { result } = renderHook(() => useSearchParam('name', { array: true }));

      expect(result.current[0]).toEqual(['value1', 'value2']);
    });

    it("updates a search param's value as string", () => {
      window.location.search = 'name=value';

      const { result } = renderHook(() => useSearchParam('name'));

      result.current[1]('updated');

      expect(pushState).toHaveBeenCalledWith(null, '', '/?name=updated');
    });

    it("updates a search param's value as string array", () => {
      window.location.search = 'name=value';

      const { result } = renderHook(() => useSearchParam('name', { array: true }));

      result.current[1](['value1', 'value2']);

      expect(pushState).toHaveBeenCalledWith(null, '', '/?name=value1&name=value2');
    });

    it('removes a search param', () => {
      window.location.search = 'name=value';

      const { result } = renderHook(() => useSearchParam('name'));

      result.current[1](null);

      expect(pushState).toHaveBeenCalledWith(null, '', '/');
    });
  });
});
