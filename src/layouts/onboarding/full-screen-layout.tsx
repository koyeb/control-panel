import LogoKoyeb from 'src/components/logo-koyeb.svg?react';
import { useForceThemeMode, ThemeMode } from 'src/hooks/theme';

export function FullScreenLayout({ children }: { children: React.ReactNode }) {
  useForceThemeMode(ThemeMode.light);

  return (
    <div className="col h-screen p-3">
      <div className="col dark relative flex-1 items-center rounded-2xl bg-neutral/95 p-16">
        <LogoKoyeb className="h-8 self-start" />
        {children}
      </div>
    </div>
  );
}
