import clsx from 'clsx';
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Dialog, Spinner } from '@koyeb/design-system';
import { api } from 'src/api/api';
import { hasMessage } from 'src/api/api-errors';
import { useOneClickApps } from 'src/api/hooks/catalog';
import { useApps, useServices } from 'src/api/hooks/service';
import { useOrganizationUnsafe, useUserOrganizationMemberships } from 'src/api/hooks/session';
import { ServiceType } from 'src/api/model';
import { useResetIdentifyUser } from 'src/application/analytics';
import { notify } from 'src/application/notify';
import { routes } from 'src/application/routes';
import { useToken } from 'src/application/token';
import { IconChevronRight } from 'src/components/icons';
import { useFeatureFlag } from 'src/hooks/feature-flag';
import { useNavigate } from 'src/hooks/router';
import { useShortcut } from 'src/hooks/shortcut';
import { ThemeMode, useThemeMode } from 'src/hooks/theme';
import { assert } from 'src/utils/assert';
import { hasProperty } from 'src/utils/object';
import { capitalize } from 'src/utils/strings';

import { Command, CommandPaletteProvider, useCommands, useRegisterCommand } from './command-palette-context';

export function CommandPalette({ children }: { children: React.ReactNode }) {
  return (
    <CommandPaletteProvider>
      <RegisterCommonCommands />
      <CommandPaletteDialog />
      {children}
    </CommandPaletteProvider>
  );
}

type Item = {
  key: React.Key;
  execute: () => void;
  children: React.ReactNode;
};

function CommandPaletteDialog() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const commands = useCommands(search);
  const [command, setCommand] = useState<Command>();

  const execute = useCallback((fn: () => void | Promise<void>) => {
    const result = fn();

    if (result === undefined) {
      setOpen(false);
    } else {
      const handleError = (error: unknown) => {
        notify.error(hasMessage(error) ? error.message : 'Unknown error');
        reportError(error);
      };

      Promise.resolve()
        .then(() => setLoading(true))
        .then(() => result)
        .then(() => setOpen(false), handleError)
        .finally(() => setLoading(false));
    }
  }, []);

  const options = useMemo((): Array<Item> => {
    if (command && 'options' in command) {
      return command.options
        .filter((option) => search === '' || command.matchOption(option, search))
        .map((option, index) => ({
          key: index,
          execute: () => execute(() => command.execute(option)),
          children: command.renderOption(option),
        }));
    }

    return commands.map((command) => ({
      key: command.id,
      execute() {
        if ('options' in command) {
          setSearch('');
          setCommand(command);
        } else {
          execute(command.execute);
        }
      },
      children: (
        <>
          <div>{command.label}</div>
          <div className="text-xs text-dim">{command.description}</div>
        </>
      ),
    }));
  }, [command, commands, search, execute]);

  useShortcut(['meta', 'k'], useFeatureFlag('new-command-palette') ? () => setOpen(true) : undefined);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [options]);

  const optionsContainer = useRef<HTMLDivElement>(null);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const key = event.key;

    if (key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();

      const option = options[highlightedIndex];

      if (option) {
        option.execute();
      }
    }

    if (key === 'ArrowUp' || key === 'ArrowDown') {
      event.preventDefault();
      event.stopPropagation();

      setHighlightedIndex((index) => {
        if (key === 'ArrowUp') {
          index--;
        }

        if (key === 'ArrowDown') {
          index++;
        }

        index += options.length;
        index %= options.length;

        optionsContainer.current?.children[index]?.scrollIntoView({ block: 'center', behavior: 'auto' });

        return index;
      });
    }

    if (command !== undefined && (key === 'Escape' || (key === 'Backspace' && search === ''))) {
      event.preventDefault();
      event.stopPropagation();
      setSearch('');
      setCommand(undefined);
    }
  };

  return (
    <Dialog
      isOpen={open}
      onClose={() => setOpen(false)}
      onClosed={() => {
        setCommand(undefined);
        setHighlightedIndex(0);
        setSearch('');
      }}
      width="3xl"
      overlayClassName="!items-start pt-8 md:pt-[20vh]"
      className="!p-0"
    >
      <div className="row items-center gap-2 border-b px-2">
        <div>
          <IconChevronRight className="text-icon my-auto size-4" />
        </div>

        <input
          type="search"
          value={search}
          onKeyDown={handleKeyDown}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full bg-transparent py-2 outline-none"
        />

        {loading && (
          <div>
            <Spinner className="text-icon my-auto size-4" />
          </div>
        )}
      </div>

      <div ref={optionsContainer} className="max-h-96 overflow-y-auto p-1">
        {options.map(({ key, execute, children }, index) => (
          <Option
            key={key}
            setHighlighted={() => setHighlightedIndex(index)}
            isHighlighted={index === highlightedIndex}
            onClick={execute}
          >
            {children}
          </Option>
        ))}
      </div>

      {options.length === 0 && (
        <div className="col min-h-16 items-center justify-center text-dim">No results</div>
      )}
    </Dialog>
  );
}

type OptionProps = {
  onClick: () => void;
  setHighlighted: () => void;
  isHighlighted: boolean;
  children: React.ReactNode;
};

const Option = forwardRef<HTMLButtonElement, OptionProps>(function Option(
  { onClick, isHighlighted, setHighlighted, children },
  ref,
) {
  return (
    <button
      ref={ref}
      onMouseMove={setHighlighted}
      onClick={onClick}
      className={clsx('col w-full gap-0.5 rounded-md px-2 py-1 text-start', isHighlighted && 'bg-muted/50')}
    >
      {children}
    </button>
  );
});

function RegisterCommonCommands() {
  useRegisterInternalNavigationCommands();
  useRegisterExternalNavigationCommands();
  useRegisterOneClickAppsCommands();
  useRegisterAccountCommands();
  useRegisterMiscCommands();

  return null;
}

function useRegisterExternalNavigationCommands() {
  const { token } = useToken();
  const organization = useOrganizationUnsafe();

  useRegisterCommand((register) => {
    if (organization?.latestSubscriptionId === undefined) {
      return;
    }

    register({
      label: 'Manage billing',
      description: 'View and manage your payment methods and invoices',
      keywords: ['billing', 'invoice', 'payment', 'card'],
      async execute() {
        const url = await api.manageBilling({ token }).then(({ url }) => url);

        assert(url !== undefined);
        window.open(url);
      },
    });
  });

  useRegisterCommand({
    label: 'Go to Koyeb website',
    description: 'Open www.koyeb.com',
    keywords: ['website', 'koyeb'],
    execute: () => void window.open('http://www.koyeb.com'),
  });

  useRegisterCommand({
    label: "View Koyeb's pricing",
    description: 'Open koyeb.com/pricing',
    keywords: ['pricing', 'cost', 'money'],
    execute: () => void window.open('http://koyeb.com/pricing'),
  });

  useRegisterCommand({
    label: 'View all one-click applications',
    description: 'Open koyeb.com/deploy',
    keywords: ['deploy', 'example', 'one-click'],
    execute: () => void window.open('http://koyeb.com/deploy'),
  });

  useRegisterCommand({
    label: 'View Koyeb tutorials',
    description: 'Open koyeb.com/tutorials',
    keywords: ['tutorials', 'help'],
    execute: () => void window.open('http://koyeb.com/tutorials'),
  });

  useRegisterCommand({
    label: "View Koyeb's changelog",
    description: 'Open koyeb.com/changelog',
    keywords: ['changelog'],
    execute: () => void window.open('http://koyeb.com/changelog'),
  });

  useRegisterCommand({
    label: "View Koyeb's blog",
    description: 'Open koyeb.com/blog',
    keywords: ['blog'],
    execute: () => void window.open('http://koyeb.com/blog'),
  });

  useRegisterCommand({
    label: 'Go to Koyeb documentation',
    description: 'Open koyeb.com/docs',
    keywords: ['documentation', 'docs', 'help'],
    execute: () => void window.open('http://koyeb.com/docs'),
  });

  useRegisterCommand({
    label: 'Go to Koyeb API documentation',
    description: 'Open developer.koyeb.com',
    keywords: ['documentation', 'docs', 'help', 'api'],
    execute: () => void window.open('http://developer.koyeb.com'),
  });

  useRegisterCommand({
    label: 'Go to the Koyeb community platform',
    description: 'Open community.koyeb.com',
    keywords: ['community', 'discourse', 'help'],
    execute: () => void window.open('http://community.koyeb.com'),
  });

  useRegisterCommand({
    label: 'Open a feature request or give feedback',
    description: 'Open feedback.koyeb.com',
    keywords: ['feedback', 'canny', 'feature', 'idea', 'improvement'],
    execute: () => void window.open('http://feedback.koyeb.com'),
  });

  useRegisterCommand({
    label: "Open the platform's status page",
    description: 'Open status.koyeb.com',
    keywords: ['status', 'instatus', 'platform', 'outage', 'uptime'],
    execute: () => void window.open('http://status.koyeb.com'),
  });
}

function useRegisterInternalNavigationCommands() {
  const navigate = useNavigate();

  useRegisterCommand({
    label: 'Go to domains',
    description: 'Manage your custom domains',
    keywords: ['domains', 'http', 'url', 'public'],
    execute: () => navigate(routes.domains()),
  });

  useRegisterCommand({
    label: 'Go to secrets',
    description: "Manage your organization's secrets",
    keywords: ['secrets', 'secure', 'private', 'protected', 'vault', 'token'],
    execute: () => navigate(routes.secrets()),
  });

  useRegisterCommand({
    label: 'Go to volumes',
    description: 'Manage your persistent volumes',
    keywords: ['volumes', 'storage', 'persistence', 'disk', 'data'],
    execute: () => navigate(routes.volumes.index()),
  });

  useRegisterCommand({
    label: 'Go to volume snapshots',
    description: "Manage your persistent volume's snapshots",
    keywords: ['volumes', 'snapshot', 'storage', 'persistence', 'disk', 'data'],
    execute: () => navigate(routes.volumes.snapshots()),
  });

  useRegisterCommand({
    label: 'Go to activity',
    description: "View your organization's recent activity",
    keywords: ['activity', 'activities', 'events'],
    execute: () => navigate(routes.activity()),
  });

  useRegisterCommand({
    label: 'Go to team members',
    description: "View and manage your organization's members",
    keywords: ['team', 'members', 'organization', 'invite', 'invitations'],
    execute: () => navigate(routes.team()),
  });

  useRegisterCommand({
    label: 'Go to organization settings',
    description: "Manage your organization's settings and view your quotas",
    keywords: ['organization', 'settings', 'quotas'],
    execute: () => navigate(routes.organizationSettings.index()),
  });

  useRegisterCommand({
    label: 'Go to organization usage and billing',
    description: "View and manage your organization's billing information",
    keywords: ['organization', 'usage', 'billing', 'payment', 'invoice', 'cost'],
    execute: () => navigate(routes.organizationSettings.billing()),
  });

  useRegisterCommand({
    label: 'Go to organization plan',
    description: "Change your organization's plan",
    keywords: [
      'organization',
      'plans',
      'pricing',
      'upgrade',
      'downgrade',
      'quotas',
      'hobby',
      'starter',
      'pro',
      'scale',
      'startup',
    ],
    execute: () => navigate(routes.organizationSettings.plans()),
  });

  useRegisterCommand({
    label: 'Go to organization API credentials',
    description: 'View and manage the API credentials bounded to your organization',
    keywords: ['organization', 'api', 'credentials', 'token'],
    execute: () => navigate(routes.organizationSettings.api()),
  });

  useRegisterCommand({
    label: 'Go to organization registry configuration',
    description: "View and manage your organization's registry configurations",
    keywords: ['organization', 'registry', 'docker', 'secrets'],
    execute: () => navigate(routes.organizationSettings.registrySecrets()),
  });

  useRegisterCommand({
    label: 'Go to personal account settings',
    description: "View and manage your account's settings",
    keywords: ['account', 'settings', 'personal', 'user', 'email', 'password'],
    execute: () => navigate(routes.userSettings.index()),
  });

  useRegisterCommand({
    label: 'Go to organizations list',
    description: "View the organizations you're a member of",
    keywords: ['account', 'organizations'],
    execute: () => navigate(routes.userSettings.organizations()),
  });

  useRegisterCommand({
    label: 'Go to personal access tokens',
    description: 'View and manage the access tokens bounded to your user account',
    keywords: ['account', 'token', 'personal', 'api'],
    execute: () => navigate(routes.userSettings.api()),
  });

  useRegisterCommand({
    label: 'Create service',
    description: 'Create a new service',
    keywords: ['create', 'deploy', 'service'],
    execute: () => navigate(routes.createService()),
  });

  useRegisterCommand({
    label: 'Create new domain',
    description: 'Create a new custom domain',
    keywords: ['create', 'domain'],
    execute: () => navigate(routes.domains(), { state: { create: true } }),
  });

  useRegisterCommand({
    label: 'Create new secret',
    description: 'Create a new organization secret',
    keywords: ['create', 'secret'],
    execute: () => navigate(routes.secrets(), { state: { create: true } }),
  });

  useRegisterCommand({
    label: 'Create new volume',
    description: 'Create a new persistent volume',
    keywords: ['create', 'volume'],
    execute: () => navigate(routes.volumes.index(), { state: { create: true } }),
  });

  const createServiceRoute = (type: ServiceType | 'private') => {
    return `${routes.createService()}?${new URLSearchParams({ service_type: type }).toString()}`;
  };

  useRegisterCommand({
    label: 'Create web service',
    description: 'Create a new web service (accessible publicly)',
    keywords: ['create', 'deploy', 'service', 'web'],
    execute: () => navigate(createServiceRoute('web')),
  });

  useRegisterCommand({
    label: 'Create private service',
    description: 'Create a new private service (only accessible within the service mesh)',
    keywords: ['create', 'deploy', 'service', 'private'],
    execute: () => navigate(createServiceRoute('private')),
  });

  useRegisterCommand({
    label: 'Create worker',
    description: 'Create a new worker service',
    keywords: ['create', 'deploy', 'service', 'worker'],
    execute: () => navigate(createServiceRoute('worker')),
  });

  useRegisterCommand({
    label: 'Create database',
    description: 'Create a new PostgreSQL database service',
    keywords: ['create', 'deploy', 'service', 'database', 'db', 'postgresql', 'neon'],
    execute: () => navigate(routes.createDatabaseService()),
  });

  const apps = useApps();
  const services = useServices();

  useRegisterCommand(
    (register) => {
      for (const service of services ?? []) {
        const app = apps?.find(hasProperty('id', service.appId));

        if (!app) {
          continue;
        }

        const name = `${app.name}/${service.name}`;
        const keywords = [name, service.id, 'service'];

        register({
          label: `Go to service ${name}`,
          description: `Navigate to the ${name} service's dashboard`,
          keywords: [...keywords, 'overview', 'dashboard', 'deployments', 'logs', 'build', 'runtime'],
          execute: () => navigate(routes.service.overview(service.id)),
        });
      }
    },
    [apps, services],
  );
}

function useRegisterOneClickAppsCommands() {
  const oneClickApps = useOneClickApps();
  const navigate = useNavigate();

  useRegisterCommand((register) => {
    for (const app of oneClickApps) {
      register({
        label: `Deploy ${app.name} one-click application`,
        description: app.description,
        keywords: [...app.slug.split('-'), 'deploy', 'example', 'one-click'],
        execute: () => navigate(app.deployUrl),
      });
    }
  });
}

function useRegisterAccountCommands() {
  const { token, setToken, clearToken } = useToken();
  const resetIdentify = useResetIdentifyUser();
  const navigate = useNavigate();

  useRegisterCommand({
    label: 'Create organization',
    description: 'Create a new Koyeb organization',
    keywords: ['create', 'organization'],
    execute: () => navigate(routes.userSettings.organizations(), { state: { create: true } }),
  });

  useRegisterCommand({
    label: 'Log out',
    description: 'Sign out from the Koyeb control panel',
    keywords: ['logout', 'exit', 'quit', 'bye'],
    async execute() {
      await api.logout({ token });
      clearToken();
      resetIdentify();
      navigate(routes.signIn());
    },
  });

  const { data: organizationMemberships = [] } = useUserOrganizationMemberships();

  useRegisterCommand(
    {
      label: 'Switch organization',
      description: `Access resources within the another organization`,
      keywords: ['switch', 'organization', 'context'],
      options: organizationMemberships,
      renderOption: ({ organization }) => organization.name,
      matchOption: ({ organization }, search) => organization.name.includes(search),
      async execute({ organization }) {
        const { token: newToken } = await api.switchOrganization({
          token,
          path: { id: organization.id },
          header: {},
        });

        setToken(newToken!.id!);
        navigate(routes.home());
      },
    },
    [organizationMemberships],
  );
}

function useRegisterMiscCommands() {
  const organization = useOrganizationUnsafe();
  const [themeMode, setThemeMode] = useThemeMode();

  useRegisterCommand(
    {
      label: 'Change theme mode',
      description: 'Change the theme mode of the interface',
      keywords: ['theme', 'light', 'dark'],
      options: Object.values(ThemeMode),
      matchOption: (theme, search) => theme.includes(search),
      renderOption: (theme) => {
        if (theme === ThemeMode.system) {
          return "Use the system's theme";
        }

        return `${capitalize(theme)} mode`;
      },
      execute: setThemeMode,
    },
    [themeMode],
  );

  useRegisterCommand((register) => {
    if (organization?.plan !== 'hobby') {
      register({
        label: 'Contact Koyeb support',
        description: 'Ask us anything through our chat',
        keywords: ['support', 'contact', 'chat', 'intercom', 'help'],
        execute: () => window.Intercom?.('showNewMessage'),
      });
    }

    register({
      label: "View this website's code",
      description: 'View the source code of the Koyeb control panel on GitHub',
      keywords: ['code', 'koyeb'],
      execute: () => void window.open('https://github.com/koyeb/control-panel'),
    });
  });
}
