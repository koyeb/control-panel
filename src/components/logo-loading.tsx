import { createPortal } from 'react-dom';

import LogoKoyeb from 'src/components/logo-koyeb.svg?react';

export function LogoLoading() {
  return createPortal(
    <div className="col fixed inset-0 z-50 items-center justify-center bg-neutral">
      <LogoKoyeb className="max-h-24 animate-pulse" />
    </div>,
    document.getElementById('root') as HTMLElement,
  );
}
