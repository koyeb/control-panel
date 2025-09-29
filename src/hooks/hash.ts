import { useEffect, useState } from 'react';

import { reportError } from 'src/application/sentry';

export function useSha256(message: string) {
  const [hash, setHash] = useState<string>();

  useEffect(() => {
    computeSha256(message).then(setHash, reportError);
  }, [message]);

  return hash;
}

async function computeSha256(message: string) {
  const input = new TextEncoder().encode(message);
  const hash = await globalThis.crypto.subtle.digest('SHA-256', input);

  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
