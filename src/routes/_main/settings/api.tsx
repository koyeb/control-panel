import { createFileRoute } from '@tanstack/react-router';

import { CrumbLink } from 'src/layouts/main/app-breadcrumbs';
import { BaseApiCredentialsPage } from 'src/pages/settings/api-credentials.page';

export const Route = createFileRoute('/_main/settings/api')({
  component: () => <BaseApiCredentialsPage type="organization" />,

  beforeLoad: () => ({
    breadcrumb: () => <CrumbLink to={Route.fullPath} />,
  }),
});
