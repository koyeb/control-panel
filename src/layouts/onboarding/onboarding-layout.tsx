import { useQuery } from '@tanstack/react-query';

import { useApiQueryFn } from 'src/api/use-api';
import LogoKoyeb from 'src/components/logo-koyeb.svg?react';
import { useSearchParams } from 'src/hooks/router';
import { useForceThemeMode } from 'src/hooks/theme';

import { OrganizationSwitcher } from '../organization-switcher';
import { SecondarySettings } from '../secondary/settings';

type OnboardingLayoutProps = {
  sentence: React.ReactNode;
  children: React.ReactNode;
};

export function OnboardingLayout({ sentence, children }: OnboardingLayoutProps) {
  const params = useSearchParams();

  useForceThemeMode('light');

  if (params.has('settings')) {
    return <SecondarySettings />;
  }

  return (
    <div className="row h-screen overflow-auto bg-muted p-3">
      <Slides sentence={sentence} />
      <main className="mx-auto col max-w-xl flex-1 py-8">{children}</main>
    </div>
  );
}

function Slides({ sentence }: { sentence: React.ReactNode }) {
  const { data: hasMultipleOrganizations } = useQuery({
    ...useApiQueryFn('listUserOrganizations', { query: {} }),
    select: ({ organizations }) => organizations!.length > 1,
  });

  return (
    <aside className="dark hidden w-full max-w-sm flex-col gap-8 rounded-2xl bg-neutral/95 px-12 py-16 lg:flex">
      <LogoKoyeb className="h-8 self-start" />

      {hasMultipleOrganizations && <OrganizationSwitcher />}

      <div className="col flex-1 justify-center gap-6">
        <div className="text-base leading-relaxed text-dim">{sentence}</div>
      </div>
    </aside>
  );
}
