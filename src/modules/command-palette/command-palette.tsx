import IconArrowDown from 'lucide-static/icons/arrow-down.svg?react';
import IconArrowLeft from 'lucide-static/icons/arrow-left.svg?react';
import IconArrowUp from 'lucide-static/icons/arrow-up.svg?react';
import IconCodeSnippet from 'lucide-static/icons/code.svg?react';
import IconCornerDownLeft from 'lucide-static/icons/corner-down-left.svg?react';
import IconDatabase from 'lucide-static/icons/database.svg?react';
import IconGlobe from 'lucide-static/icons/earth.svg?react';
import IconGithub from 'lucide-static/icons/github.svg?react';
import IconSearch from 'lucide-static/icons/search.svg?react';
import IconSettings from 'lucide-static/icons/settings.svg?react';
import { useCallback, useRef } from 'react';

import { Dialog } from '@koyeb/design-system';
import { useGithubApp } from 'src/api/hooks/git';
import { useExampleApps } from 'src/api/hooks/service';
import { Shortcut } from 'src/components/shortcut';
import { useShortcut } from 'src/hooks/shortcut';
import IconDocker from 'src/icons/docker.svg?react';
import { Translate } from 'src/intl/translate';

import { Navigation } from './navigation';
import { Docker, Github } from './pages/deployment-method';
import { DockerImageSelection } from './pages/docker-image';
import {
  GithubOrganizationImage,
  OrganizationRepositoriesList,
  PublicRepository,
} from './pages/github-repository';
import { Database, ExampleApp, WebService, Worker } from './pages/root';
import { CommandPaletteProvider, CommandPaletteSection, useCommandPalette } from './use-command-palette';

const T = Translate.prefix('commandPalette');

function useGetSections() {
  const t = T.useTranslate();
  const exampleApps = useExampleApps();
  const githubApp = useGithubApp();

  return useCallback(
    (
      serviceType: 'web' | 'worker' | undefined,
      deploymentMethod: 'github' | 'docker' | undefined,
    ): CommandPaletteSection[] => {
      if (serviceType === undefined && deploymentMethod === undefined) {
        return [
          {
            title: t('navigation.create'),
            items: [
              {
                label: t('navigation.webService'),
                icon: <IconGlobe className="icon" />,
                shortcut: '1',
                render: () => <WebService />,
              },
              {
                label: t('navigation.worker'),
                icon: <IconSettings className="icon" />,
                shortcut: '2',
                render: () => <Worker />,
              },
              {
                label: t('navigation.database'),
                icon: <IconDatabase className="icon" />,
                shortcut: '3',
                render: () => <Database />,
              },
            ],
          },
          {
            title: t('navigation.exampleApps'),
            items: exampleApps?.map((app) => ({
              label: app.name,
              icon: <img src={app.logo} className="icon rounded-full bg-black/50 grayscale" />,
              render: () => <ExampleApp app={app} />,
            })),
          },
        ];
      }

      if (deploymentMethod === undefined) {
        return [
          {
            title: t('navigation.source'),
            items: [
              {
                label: t('navigation.github'),
                icon: <IconGithub className="icon" />,
                shortcut: '1',
                render: () => <Github />,
              },
              {
                label: t('navigation.docker'),
                icon: <IconDocker className="icon" />,
                shortcut: '2',
                render: () => <Docker />,
              },
            ],
          },
        ];
      }

      if (deploymentMethod === 'github') {
        return [
          {
            title: t('navigation.source'),
            items: [
              {
                label: githubApp?.organizationName ?? t('navigation.yourRepository'),
                icon: <GithubOrganizationImage />,
                shortcut: '1',
                render: () => <OrganizationRepositoriesList />,
              },
              {
                label: t('navigation.publicRepository'),
                icon: <IconCodeSnippet className="icon" />,
                shortcut: '2',
                render: () => <PublicRepository />,
              },
            ],
          },
        ];
      }

      if (deploymentMethod === 'docker') {
        return [
          {
            title: t('navigation.source'),
            items: [
              {
                label: t('navigation.dockerImage'),
                icon: <IconDocker className="icon" />,
                shortcut: '1',
                render: () => <DockerImageSelection />,
              },
            ],
          },
        ];
      }

      return [];
    },
    [t, exampleApps, githubApp],
  );
}

export function CommandPalette() {
  const getSections = useGetSections();

  return (
    <CommandPaletteProvider getSections={getSections}>
      <CommandPaletteDialog />
    </CommandPaletteProvider>
  );
}

export function CommandPaletteDialog() {
  const { isOpen, dialogOpened, dialogClosed, reset } = useCommandPalette();

  useShortcut(['meta', 'k'], dialogOpened);

  return (
    <Dialog
      width="2xl"
      isOpen={isOpen}
      onClose={dialogClosed}
      onClosed={reset}
      className="col h-96 overflow-hidden rounded-lg border !p-0"
    >
      <CommandPaletteShortcuts />
      <SearchInput />
      <Content />
      <Footer />
    </Dialog>
  );
}

function CommandPaletteShortcuts() {
  const ref = useRef<HTMLDivElement>(null);
  const parent = ref.current?.parentElement ?? undefined;

  const { arrowKeyPressed, backspacePressed } = useCommandPalette();

  useShortcut(['ArrowUp'], () => arrowKeyPressed('up'), parent);
  useShortcut(['ArrowDown'], () => arrowKeyPressed('down'), parent);

  useShortcut(
    ['Backspace'],
    (event) => {
      if (event.target instanceof HTMLInputElement) {
        return false;
      }

      backspacePressed();
    },
    parent,
  );

  return <div ref={ref} />;
}

function SearchInput() {
  const t = T.useTranslate();
  const { search, searchChanged, searchInputRef, focusSearchInput, backspacePressed } = useCommandPalette();

  return (
    <div className="row items-center gap-2 border-b px-4">
      <IconSearch className="icon" />

      <input
        ref={searchInputRef}
        value={search}
        onChange={(event) => searchChanged(event.target.value)}
        placeholder={t('searchPlaceholder')}
        className="flex-1 bg-transparent py-4 outline-none"
        onKeyDown={(event) => {
          if (event.key === 'Backspace' && search === '') {
            backspacePressed();
          }
        }}
      />

      <Shortcut keystrokes={['meta', 'K']} onTrigger={focusSearchInput} />
    </div>
  );
}

function Content() {
  const { page } = useCommandPalette();

  return (
    // eslint-disable-next-line tailwindcss/no-arbitrary-value
    <div className="grid flex-1 grid-cols-[18rem,1fr] overflow-hidden">
      <Navigation />
      {page?.render()}
    </div>
  );
}

function Footer() {
  return (
    <div className="row gap-6 border-t px-4 py-3">
      <div className="row items-center gap-2 text-dim">
        <Shortcut keystrokes={['ArrowUp']} icon={<IconArrowUp className="icon" />} />
        <Shortcut keystrokes={['ArrowDown']} icon={<IconArrowDown className="icon" />} />
        <T id="shortcuts.navigate" />
      </div>

      <div className="row items-center gap-2 text-dim">
        <Shortcut keystrokes={['Enter']} icon={<IconCornerDownLeft className="icon" />} />
        <T id="shortcuts.select" />
      </div>

      <div className="row items-center gap-2 text-dim">
        <Shortcut
          keystrokes={['Escape']}
          icon={<span className="icon p-1 font-medium leading-5">esc</span>}
        />
        <T id="shortcuts.close" />
      </div>

      <div className="row items-center gap-2 text-dim">
        <Shortcut keystrokes={['ArrowLeft']} icon={<IconArrowLeft className="icon" />} />
        <T id="shortcuts.return" />
      </div>
    </div>
  );
}
