import { useEffect } from 'react';

import { detectOperatingSystem } from 'src/application/detect-operating-system';

export function useShortcut(
  keystrokes: string[],
  onTrigger?: (event: KeyboardEvent) => void | false,
  target: Pick<HTMLElement, 'addEventListener' | 'removeEventListener'> = window,
) {
  useEffect(() => {
    if (keystrokes.length === 0 || onTrigger === undefined) {
      return;
    }

    const listener = (event: KeyboardEvent) => {
      if (checkKeyStrokes(keystrokes, event)) {
        if (onTrigger(event) !== false) {
          event.preventDefault();
        }
      }
    };

    target.addEventListener('keydown', listener);

    return () => {
      target.removeEventListener('keydown', listener);
    };
  }, [target, keystrokes, onTrigger]);
}

function checkKeyStrokes(keystrokes: string[], event: KeyboardEvent) {
  const os = detectOperatingSystem();
  const keys = keystrokes.slice();

  if (keys[0] === 'meta') {
    if (os === 'mac' && !event.metaKey) {
      return false;
    }

    if (os !== 'mac' && !event.ctrlKey) {
      return false;
    }

    keys.shift();
  }

  // event.key is undefined on chrome when accepting autofill suggestions
  // https://issues.chromium.org/issues/41425904
  if (event.key !== undefined && keys[0]?.toLowerCase() === event.key.toLowerCase()) {
    keys.shift();
  }

  return keys.length === 0;
}
