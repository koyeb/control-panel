if (typeof globalThis === 'undefined' && typeof window !== 'undefined') {
  // @ts-expect-error polyfill for old browser
  window.globalThis = window;
}

if (typeof globalThis.crypto.randomUUID === 'undefined') {
  void import('uuid').then(({ v4 }) => {
    globalThis.crypto.randomUUID = v4 as typeof globalThis.crypto.randomUUID;
  });
}
