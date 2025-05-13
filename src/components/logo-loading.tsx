import { useState } from 'react';
import { createPortal } from 'react-dom';

import LogoKoyeb from 'src/components/logo-koyeb.svg?react';
import { useMount } from 'src/hooks/lifecycle';

export function LogoLoading() {
  const [show, setShow] = useState(false);

  useMount(() => {
    const timeout = setTimeout(() => setShow(true), 500);

    return () => {
      clearTimeout(timeout);
    };
  });

  if (!show) {
    return null;
  }

  return createPortal(
    <div className="col fixed inset-0 z-60 items-center justify-center bg-neutral">
      <LogoKoyeb className="max-h-24 animate-pulse" />
    </div>,
    document.getElementById('root') as HTMLElement,
  );
}
