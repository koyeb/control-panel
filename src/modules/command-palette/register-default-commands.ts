import * as intercom from '@intercom/messenger-js-sdk';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useOneClickApps } from 'src/api/hooks/catalog';
import { useApps, useServices } from 'src/api/hooks/service';
import { useOrganizationUnsafe, useUserOrganizationMemberships } from 'src/api/hooks/session';
import { ServiceType } from 'src/api/model';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { useAuth } from 'src/application/authentication';
import { useResetIdentifyUser } from 'src/application/posthog';
import { routes } from 'src/application/routes';
import { Dialog } from 'src/components/dialog';
import { useMount } from 'src/hooks/lifecycle';
import { useNavigate } from 'src/hooks/router';
import { ThemeMode, useThemeMode } from 'src/hooks/theme';
import { defined } from 'src/utils/assert';
import { hasProperty } from 'src/utils/object';
import { capitalize } from 'src/utils/strings';

import { PaletteItem, useCommandPaletteContext } from './command-palette.provider';

export function useRegisterDefaultItems() {
  const { defaultItems } = useCommandPaletteContext();

  useEffect(() => {
    return () => defaultItems.clear();
  }, [defaultItems]);

  useRegisterExternalNavigationCommands();
  useRegisterInternalNavigationCommands();
  useRegisterServiceNavigationCommands();
  useRegisterOneClickAppsCommands();
  useRegisterAccountCommands();
  useRegisterMiscCommands();
}

function useRegisterExternalNavigationCommands() {
  const { defaultItems, mutationEffects } = useCommandPaletteContext();
  const closeDialog = Dialog.useClose();

  useMount(() => {
    defaultItems.add({
      label: 'Go to Koyeb website',
      description: 'Open www.koyeb.com',
      keywords: ['website', 'koyeb'],
      execute: () => void window.open('http://www.koyeb.com'),
    });

    defaultItems.add({
      label: "View Koyeb's pricing",
      description: 'Open koyeb.com/pricing',
      keywords: ['pricing', 'cost', 'money'],
      execute: () => void window.open('http://koyeb.com/pricing'),
    });

    defaultItems.add({
      label: 'View all one-click applications',
      description: 'Open koyeb.com/deploy',
      keywords: ['deploy', 'example', 'one-click'],
      execute: () => void window.open('http://koyeb.com/deploy'),
    });

    defaultItems.add({
      label: 'View Koyeb tutorials',
      description: 'Open koyeb.com/tutorials',
      keywords: ['tutorials', 'help'],
      execute: () => void window.open('http://koyeb.com/tutorials'),
    });

    defaultItems.add({
      label: "View Koyeb's changelog",
      description: 'Open koyeb.com/changelog',
      keywords: ['changelog'],
      execute: () => void window.open('http://koyeb.com/changelog'),
    });

    defaultItems.add({
      label: "View Koyeb's blog",
      description: 'Open koyeb.com/blog',
      keywords: ['blog'],
      execute: () => void window.open('http://koyeb.com/blog'),
    });

    defaultItems.add({
      label: 'Go to Koyeb documentation',
      description: 'Open koyeb.com/docs',
      weight: 1,
      keywords: ['documentation', 'docs', 'help', 'manual'],
      execute: () => void window.open('http://koyeb.com/docs'),
    });

    defaultItems.add({
      label: 'Go to Koyeb API documentation',
      description: 'Open developer.koyeb.com',
      keywords: ['documentation', 'docs', 'help', 'api', 'manual'],
      execute: () => void window.open('http://developer.koyeb.com'),
    });

    defaultItems.add({
      label: 'Go to the Koyeb community platform',
      description: 'Open community.koyeb.com',
      keywords: ['community', 'discourse', 'help'],
      weight: 1,
      execute: () => void window.open('http://community.koyeb.com'),
    });

    defaultItems.add({
      label: 'Open a feature request or give feedback',
      description: 'Open feedback.koyeb.com',
      keywords: ['feedback', 'canny', 'feature', 'idea', 'improvement'],
      execute: () => void window.open('http://feedback.koyeb.com'),
    });

    defaultItems.add({
      label: "Open the platform's status page",
      description: 'Open status.koyeb.com',
      keywords: ['status', 'instatus', 'platform', 'outage', 'uptime'],
      execute: () => void window.open('http://status.koyeb.com'),
    });
  });

  const organization = useOrganizationUnsafe();

  const { mutate: manageBilling } = useMutation({
    ...useApiMutationFn('manageBilling', {}),
    ...mutationEffects,
    onSuccess: ({ url }) => {
      window.open(defined(url));
      closeDialog();
    },
  });

  useEffect(() => {
    if (organization?.latestSubscriptionId !== undefined) {
      const command: PaletteItem = {
        label: 'Manage billing',
        description: 'View and manage your payment methods and invoices',
        keywords: ['billing', 'invoice', 'payment', 'card'],
        keepOpen: true,
        execute: () => {
          manageBilling();
          return false;
        },
      };

      defaultItems.add(command);

      return () => {
        defaultItems.delete(command);
      };
    }
  }, [organization, defaultItems, manageBilling]);
}

function useRegisterInternalNavigationCommands() {
  const { defaultItems, setItems } = useCommandPaletteContext();
  const navigate = useNavigate();

  useMount(() => {
    defaultItems.add({
      label: 'Go to domains',
      description: 'Manage your custom domains',
      keywords: ['domains', 'http', 'url', 'public'],
      execute: () => navigate(routes.domains()),
    });

    defaultItems.add({
      label: 'Go to secrets',
      description: "Manage your organization's secrets",
      keywords: ['secrets', 'secure', 'private', 'protected', 'vault', 'token'],
      execute: () => navigate(routes.secrets()),
    });

    defaultItems.add({
      label: 'Go to volumes',
      description: 'Manage your persistent volumes',
      keywords: ['volumes', 'storage', 'persistence', 'disk', 'data'],
      execute: () => navigate(routes.volumes.index()),
    });

    defaultItems.add({
      label: 'Go to volume snapshots',
      description: "Manage your persistent volume's snapshots",
      keywords: ['volumes', 'snapshot', 'storage', 'persistence', 'disk', 'data'],
      execute: () => navigate(routes.volumes.snapshots()),
    });

    defaultItems.add({
      label: 'Go to activity',
      description: "View your organization's recent activity",
      keywords: ['activity', 'activities', 'events'],
      execute: () => navigate(routes.activity()),
    });

    defaultItems.add({
      label: 'Go to team members',
      description: "View and manage your organization's members",
      keywords: ['team', 'members', 'organization', 'invite', 'invitations'],
      execute: () => navigate(routes.team()),
    });

    defaultItems.add({
      label: 'Go to organization settings',
      description: "Manage your organization's settings and view your quotas",
      keywords: ['organization', 'settings', 'quotas'],
      execute: () => navigate(routes.organizationSettings.index()),
    });

    defaultItems.add({
      label: 'Go to organization usage and billing',
      description: "View and manage your organization's billing information",
      keywords: ['organization', 'usage', 'billing', 'payment', 'invoice', 'cost'],
      execute: () => navigate(routes.organizationSettings.billing()),
    });

    defaultItems.add({
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

    defaultItems.add({
      label: 'Go to organization API credentials',
      description: 'View and manage the API credentials bounded to your organization',
      keywords: ['organization', 'api', 'credentials', 'token'],
      execute: () => navigate(routes.organizationSettings.api()),
    });

    defaultItems.add({
      label: 'Go to organization registry configuration',
      description: "View and manage your organization's registry configurations",
      keywords: ['organization', 'registry', 'docker', 'secrets'],
      execute: () => navigate(routes.organizationSettings.registrySecrets()),
    });

    defaultItems.add({
      label: 'Go to personal account settings',
      description: "View and manage your account's settings",
      keywords: ['account', 'settings', 'personal', 'user', 'email', 'password'],
      execute: () => navigate(routes.userSettings.index()),
    });

    defaultItems.add({
      label: 'Go to organizations list',
      description: "View the organizations you're a member of",
      keywords: ['account', 'organizations'],
      execute: () => navigate(routes.userSettings.organizations()),
    });

    defaultItems.add({
      label: 'Go to personal access tokens',
      description: 'View and manage the access tokens bounded to your user account',
      keywords: ['account', 'token', 'personal', 'api'],
      execute: () => navigate(routes.userSettings.api()),
    });

    defaultItems.add({
      label: 'Create new domain',
      description: 'Create a new custom domain',
      keywords: ['create', 'domain'],
      execute: () => navigate(routes.domains(), { state: { create: true } }),
    });

    defaultItems.add({
      label: 'Create new secret',
      description: 'Create a new organization secret',
      keywords: ['create', 'secret'],
      execute: () => navigate(routes.secrets(), { state: { create: true } }),
    });

    defaultItems.add({
      label: 'Create new volume',
      description: 'Create a new persistent volume',
      keywords: ['create', 'volume'],
      execute: () => navigate(routes.volumes.index(), { state: { create: true } }),
    });

    defaultItems.add({
      label: 'Create service',
      description: 'Create a new service',
      keywords: ['create', 'deploy', 'service', 'web'],
      weight: 2,
      keepOpen: true,
      execute: () => {
        const getUrl = (type: ServiceType | 'private') => {
          const url = new URL(routes.createService(), window.origin);

          url.searchParams.set('service_type', type);

          return url.toString();
        };

        setItems([
          {
            label: 'Web service',
            description: 'Can be accessed accessible from the Internet or the private network',
            keywords: ['create', 'deploy', 'service', 'private'],
            execute: () => navigate(getUrl('private')),
          },
          {
            label: 'Private service',
            description: 'Only exposed to your other services via the internal private network',
            keywords: ['create', 'deploy', 'service', 'private'],
            execute: () => navigate(getUrl('private')),
          },
          {
            label: 'Worker',
            description: 'For long running processes like background processing and task execution',
            keywords: ['create', 'deploy', 'service', 'worker'],
            execute: () => navigate(getUrl('worker')),
          },
          {
            label: 'Database',
            description: 'A fully managed, serverless Postgres database',
            keywords: ['create', 'deploy', 'service', 'database', 'db', 'postgresql', 'neon'],
            execute: () => navigate(routes.createDatabaseService()),
          },
        ]);
      },
    });
  });
}

function useRegisterServiceNavigationCommands() {
  const { defaultItems } = useCommandPaletteContext();
  const navigate = useNavigate();

  const apps = useApps();
  const services = useServices();

  useEffect(() => {
    const commands: PaletteItem[] = [];

    for (const service of services ?? []) {
      const app = apps?.find(hasProperty('id', service.appId));

      if (!app) {
        continue;
      }

      const name = `${app.name}/${service.name}`;
      const keywords = [name, service.id, 'service'];

      commands.push({
        label: `Go to service ${name}`,
        description: `Navigate to the ${name} service's dashboard`,
        keywords: [...keywords, 'overview', 'dashboard', 'deployments', 'logs', 'build', 'runtime'],
        weight: 3,
        execute: () => navigate(routes.service.overview(service.id)),
      });
    }

    commands.forEach((command) => defaultItems.add(command));

    return () => {
      commands.forEach((command) => defaultItems.delete(command));
    };
  }, [navigate, defaultItems, apps, services]);
}

function useRegisterOneClickAppsCommands() {
  const { defaultItems } = useCommandPaletteContext();
  const oneClickApps = useOneClickApps();
  const navigate = useNavigate();

  useMount(() => {
    for (const app of oneClickApps) {
      defaultItems.add({
        label: `Deploy ${app.name} one-click application`,
        description: app.description,
        keywords: [...app.slug.split('-'), 'deploy', 'example', 'one-click'],
        execute: () => navigate(app.deployUrl),
      });
    }
  });
}

function useRegisterAccountCommands() {
  const { defaultItems, setItems, mutationEffects } = useCommandPaletteContext();

  const { setToken, clearToken } = useAuth();
  const resetIdentify = useResetIdentifyUser();
  const navigate = useNavigate();

  const { mutate: logout } = useMutation({
    ...useApiMutationFn('logout', {}),
    ...mutationEffects,
    onSuccess: () => {
      clearToken();
      resetIdentify();
      navigate(routes.signIn());
    },
  });

  useMount(() => {
    defaultItems.add({
      label: 'Create organization',
      description: 'Create a new Koyeb organization',
      keywords: ['create', 'organization'],
      weight: 1,
      execute: () => navigate(routes.userSettings.organizations(), { state: { create: true } }),
    });

    defaultItems.add({
      label: 'Log out',
      description: 'Sign out from the Koyeb control panel',
      keywords: ['logout', 'exit', 'quit', 'bye'],
      weight: 1,
      execute: logout,
    });
  });

  const { data: organizationMemberships } = useUserOrganizationMemberships();
  const invalidate = useInvalidateApiQuery();

  const { mutate: switchOrganization } = useMutation({
    ...useApiMutationFn('switchOrganization', (organizationId: string) => ({
      path: { id: organizationId },
      header: {},
    })),
    ...mutationEffects,
    async onSuccess(token) {
      setToken(token.token!.id!);
      await Promise.all([invalidate('getCurrentOrganization'), invalidate('listOrganizationMembers')]);
      navigate(routes.home());
    },
  });

  useEffect(() => {
    const command: PaletteItem = {
      label: 'Switch organization',
      description: `Access resources within the another organization`,
      keywords: ['switch', 'organization', 'context'],
      weight: 2,
      keepOpen: true,
      execute: () => {
        if (organizationMemberships === undefined) {
          return;
        }

        setItems(
          organizationMemberships.map(({ organization }) => ({
            label: organization.name,
            keywords: [organization.name],
            execute: () => switchOrganization(organization.id),
          })),
        );
      },
    };

    defaultItems.add(command);

    return () => {
      defaultItems.delete(command);
    };
  }, [defaultItems, organizationMemberships, setItems, switchOrganization]);
}

function useRegisterMiscCommands() {
  const { defaultItems, setItems } = useCommandPaletteContext();
  const organization = useOrganizationUnsafe();
  const [, setThemeMode] = useThemeMode();

  useMount(() => {
    defaultItems.add({
      label: 'Change theme mode',
      description: 'Change the theme mode of the interface',
      keywords: ['theme', 'light', 'dark'],
      weight: 1,
      keepOpen: true,
      execute: () => {
        const modes: ThemeMode[] = [ThemeMode.light, ThemeMode.dark, ThemeMode.system];

        setItems(
          modes.map((mode) => ({
            label: `${capitalize(mode)} mode`,
            description: '',
            keywords: [mode],
            execute: () => setThemeMode(mode),
          })),
        );
      },
    });

    defaultItems.add({
      label: "View this website's code",
      description: 'View the source code of the Koyeb control panel on GitHub',
      keywords: ['code', 'koyeb'],
      execute: () => void window.open('https://github.com/koyeb/control-panel'),
    });

    if (organization?.plan !== 'hobby') {
      defaultItems.add({
        label: 'Contact Koyeb support',
        description: 'Ask us anything through our chat',
        keywords: ['support', 'contact', 'chat', 'intercom', 'help'],
        execute: () => intercom.showNewMessage(''),
      });
    }
  });
}
