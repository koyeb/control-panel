import { createFileRoute } from '@tanstack/react-router';

import { Crumb } from 'src/layouts/main/app-breadcrumbs';
import { RegistrySecretsPage } from 'src/pages/settings/organization/registry-secrets/registry-secrets.page';

export const Route = createFileRoute('/_main/settings/registry-configuration')({
  component: RegistrySecretsPage,

  beforeLoad: () => ({
    breadcrumb: () => <Crumb to={Route.fullPath} />,
  }),
});
