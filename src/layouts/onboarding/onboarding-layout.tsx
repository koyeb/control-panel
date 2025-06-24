import LogoKoyeb from 'src/components/logo-koyeb.svg?react';
import { useSearchParams } from 'src/hooks/router';
import { ThemeMode, useForceThemeMode } from 'src/hooks/theme';

import { SecondarySettings } from '../secondary/settings';

type OnboardingLayoutProps = {
  sentence: React.ReactNode;
  children: React.ReactNode;
};

export function OnboardingLayout({ sentence, children }: OnboardingLayoutProps) {
  const params = useSearchParams();

  useForceThemeMode(ThemeMode.light);

  if (params.has('settings')) {
    return <SecondarySettings />;
  }

  return (
    <div className="row h-screen overflow-auto bg-muted p-3">
      <Slides sentence={sentence} />
      <main className="col mx-auto max-w-xl flex-1 py-8">{children}</main>
    </div>
  );
}

function Slides({ sentence }: { sentence: React.ReactNode }) {
  return (
    <aside className="dark hidden w-full max-w-sm flex-col rounded-2xl bg-neutral/95 px-12 py-16 lg:flex">
      <LogoKoyeb className="h-8 self-start" />

      <div className="col flex-1 justify-center gap-6">
        <div className="text-base leading-relaxed text-dim">{sentence}</div>
      </div>
    </aside>
  );
}
