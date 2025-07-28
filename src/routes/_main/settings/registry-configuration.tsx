import { createFileRoute } from '@tanstack/react-router';

import { RegistrySecretsPage } from 'src/pages/settings/organization/registry-secrets/registry-secrets.page';

export const Route = createFileRoute('/_main/settings/registry-configuration')({
  component: RegistrySecretsPage,
});
