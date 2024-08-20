import LogoKoyeb from 'src/components/logo-koyeb.svg?react';

export function LogoLoading() {
  return (
    <div className="col min-h-screen items-center justify-center">
      <LogoKoyeb className="max-h-24 animate-pulse" />
    </div>
  );
}
