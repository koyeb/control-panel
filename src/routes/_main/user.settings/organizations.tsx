import { createFileRoute } from '@tanstack/react-router';

import { OrganizationsPage } from 'src/pages/settings/user/organizations.page';

export const Route = createFileRoute('/_main/user/settings/organizations')({
  component: OrganizationsPage,
});
