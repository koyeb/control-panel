import { createFileRoute } from '@tanstack/react-router';
import { getBreadcrumb } from 'src/layouts/main/app-breadcrumbs';

import { DomainsPage } from 'src/pages/domains/domains.page';

export const Route = createFileRoute('/_main/domains')({
  component: DomainsPage,

  loader: ({ context, location }) => {
    context.breadcrumb = getBreadcrumb(location, 'domains');
  },
});
