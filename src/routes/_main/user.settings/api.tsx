import { createFileRoute } from '@tanstack/react-router';

import { CrumbLink } from 'src/layouts/main/app-breadcrumbs';
import { BaseApiCredentialsPage } from 'src/pages/settings/api-credentials.page';

export const Route = createFileRoute('/_main/user/settings/api')({
  component: () => <BaseApiCredentialsPage type="user" />,

  beforeLoad: () => ({
    breadcrumb: () => <CrumbLink to={Route.fullPath} />,
  }),
});
