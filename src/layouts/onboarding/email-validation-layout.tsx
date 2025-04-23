import LogoKoyeb from 'src/components/logo-koyeb.svg?react';

export function EmailValidationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="col h-screen p-3">
      <div className="col dark relative flex-1 items-center rounded-2xl bg-neutral/95 p-16">
        <LogoKoyeb className="h-8 self-start" />
        {children}
      </div>
    </div>
  );
}
