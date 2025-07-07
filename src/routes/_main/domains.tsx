import { createFileRoute } from '@tanstack/react-router';

import { Crumb } from 'src/layouts/main/app-breadcrumbs';
import { DomainsPage } from 'src/pages/domains/domains.page';

export const Route = createFileRoute('/_main/domains')({
  component: DomainsPage,

  beforeLoad: () => ({
    breadcrumb: () => <Crumb to={Route.fullPath} />,
  }),
});
