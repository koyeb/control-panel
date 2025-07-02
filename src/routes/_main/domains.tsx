import { createFileRoute } from '@tanstack/react-router';

import { DomainsPage } from 'src/pages/domains/domains.page';

export const Route = createFileRoute('/_main/domains')({
  component: DomainsPage,
});
