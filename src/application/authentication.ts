import { type ParsedLocation, redirect } from '@tanstack/react-router';

export function getToken() {
  return localStorage.getItem('access-token');
}

export function setToken(token: string | null) {
  if (token !== null) {
    localStorage.setItem('access-token', token);
  } else {
    localStorage.removeItem('access-token');
  }
}

export function isAuthenticated() {
  return getToken() !== null;
}

export function redirectToSignIn(location: ParsedLocation): never {
  throw redirect({
    to: '/auth/signin',
    replace: true,
    search: {
      next: location.href !== '/' ? location.href : undefined,
    },
  });
}
