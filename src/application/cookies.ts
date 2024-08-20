import { getConfig } from './config';

export function getCookie(name: string): string | null {
  for (const cookie of document.cookie.split(';')) {
    const [key, value] = cookie.split('=');

    if (key && value && key.trim() === name) {
      return value;
    }
  }

  return null;
}

export function setCookie(
  name: string,
  value: string,
  options: Record<string, string | boolean | undefined> = {},
): void {
  options.Domain ??= getDomain();

  document.cookie = Object.entries({ [name]: value, ...options })
    .filter(([, value]) => value !== undefined && value !== false)
    .map(([key, value]) => (value === true ? key : `${key}=${value}`))
    .join(';');
}

function getDomain(): string | undefined {
  const { environment } = getConfig();

  if (environment === 'production') {
    return 'app.koyeb.com';
  }

  if (environment === 'staging') {
    return 'staging.koyeb.com';
  }
}
