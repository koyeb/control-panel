import { useCallback, useRef } from 'react';

import { useOneClickApps } from 'src/api/hooks/catalog';
import { useGithubApp } from 'src/api/hooks/git';
import { Dialog } from 'src/components/dialog';
import { Shortcut } from 'src/components/shortcut';
import { useFeatureFlag } from 'src/hooks/feature-flag';
import { useShortcut } from 'src/hooks/shortcut';
import {
  IconArrowDown,
  IconArrowLeft,
  IconArrowUp,
  IconCornerDownLeft,
  IconDatabase,
  IconDocker,
  IconGithub,
  IconGlobe,
  IconSearch,
  IconSettings,
  IconSquareCode,
} from 'src/icons';
import { createTranslate } from 'src/intl/translate';

import { Navigation } from './navigation';
import { Docker, Github } from './pages/deployment-method';
import { DockerImageSelection } from './pages/docker-image';
import {
  GithubOrganizationImage,
  OrganizationRepositoriesList,
  PublicRepository,
} from './pages/github-repository';
import { Database, OneClickApp, WebService, Worker } from './pages/root';
import {
  CreateServiceDialogProvider,
  CreateServiceDialogSection,
  useCreateServiceDialog,
} from './use-create-service-dialog';

const T = createTranslate('modules.createServiceDialog');

function useGetSections() {
  const t = T.useTranslate();
  const oneClickApps = useOneClickApps();
  const githubApp = useGithubApp();

  return useCallback(
    (
      serviceType: 'web' | 'worker' | undefined,
      deploymentMethod: 'github' | 'docker' | undefined,
    ): CreateServiceDialogSection[] => {
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
            title: t('navigation.oneClickApps'),
            items: oneClickApps?.map((app) => ({
              label: app.name,
              icon: <img src={app.logo} className="icon rounded-full bg-black/50 grayscale" />,
              render: () => <OneClickApp app={app} />,
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
                icon: <IconSquareCode className="icon" />,
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
    [t, oneClickApps, githubApp],
  );
}

export function CreateServiceDialog() {
  const getSections = useGetSections();

  return (
    <CreateServiceDialogProvider getSections={getSections}>
      <CreateServiceDialogDialog />
    </CreateServiceDialogProvider>
  );
}

function CreateServiceDialogDialog() {
  const { dialogOpened, reset } = useCreateServiceDialog();

  useShortcut(['meta', 'k'], useFeatureFlag('new-command-palette') ? undefined : dialogOpened);

  return (
    <Dialog
      id="CreateService"
      onClosed={reset}
      className="col h-96 w-full max-w-2xl overflow-hidden rounded-lg border !p-0"
    >
      <CreateServiceDialogShortcuts />
      <SearchInput />
      <Content />
      <Footer />
    </Dialog>
  );
}

function CreateServiceDialogShortcuts() {
  const ref = useRef<HTMLDivElement>(null);
  const parent = ref.current?.parentElement ?? undefined;

  const { arrowKeyPressed, backspacePressed } = useCreateServiceDialog();

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
  const { search, searchChanged, searchInputRef, focusSearchInput, backspacePressed } =
    useCreateServiceDialog();

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
  const { page } = useCreateServiceDialog();

  return (
    <div className="grid flex-1 grid-cols-[18rem_1fr] overflow-hidden">
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
          icon={<span className="icon p-1 leading-5 font-medium">esc</span>}
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
