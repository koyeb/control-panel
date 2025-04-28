import LogoKoyeb from 'src/components/logo-koyeb.svg?react';
import { ThemeMode, useForceThemeMode } from 'src/hooks/theme';

export function OnboardingLayout({ children }: { children: React.ReactNode }) {
  useForceThemeMode(ThemeMode.light);

  return (
    <div className="row h-screen overflow-auto bg-muted p-3">
      <Slides />
      <main className="col mx-auto max-w-xl flex-1 py-8">{children}</main>
    </div>
  );
}

function Slides() {
  return (
    <aside className="dark hidden w-full max-w-sm flex-col rounded-2xl bg-neutral/95 px-12 py-16 lg:flex">
      <LogoKoyeb className="h-8 self-start" />

      <div className="col flex-1 gap-6 pt-24">
        <div className="aspect-square rounded-lg bg-muted" />
        <div className="text-3xl font-semibold">Deploy LLM Models Effortlessly</div>
        <div className="text-base text-dim">
          Deploy, scale, and integrate Large Language Models in minutes.
        </div>
      </div>
    </aside>
  );
}
