import { createFileRoute } from '@tanstack/react-router';

import { CrumbLink } from 'src/layouts/main/app-breadcrumbs';
import { SecretsPage } from 'src/pages/secrets/secrets.page';

export const Route = createFileRoute('/_main/secrets')({
  component: SecretsPage,

  beforeLoad: () => ({
    breadcrumb: () => <CrumbLink to={Route.fullPath} />,
  }),
});
