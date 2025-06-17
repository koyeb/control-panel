import LogoKoyeb from 'src/components/logo-koyeb.svg?react';
import { useSearchParams } from 'src/hooks/router';
import { ThemeMode, useForceThemeMode } from 'src/hooks/theme';
import { createTranslate } from 'src/intl/translate';

import { SecondarySettings } from '../secondary/settings';

const T = createTranslate('layouts.onboarding');

export function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const params = useSearchParams();

  useForceThemeMode(ThemeMode.light);

  if (params.has('settings')) {
    return <SecondarySettings />;
  }

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

      <div className="col flex-1 justify-center gap-6">
        <div className="text-base leading-relaxed text-dim">
          <T
            id="description"
            values={{ strong: (children) => <strong className="font-bold">{children}</strong> }}
          />
        </div>
      </div>
    </aside>
  );
}
