type OperatingSystem = 'windows' | 'mac' | 'linux' | 'unknown';

export function detectOperatingSystem(): OperatingSystem {
  if (navigator.userAgent.indexOf('Win') !== -1) {
    return 'windows';
  }

  if (navigator.userAgent.indexOf('Mac') !== -1) {
    return 'mac';
  }

  if (navigator.userAgent.indexOf('X11') !== -1) {
    return 'linux';
  }

  if (navigator.userAgent.indexOf('Linux') !== -1) {
    return 'linux';
  }

  return 'unknown';
}
