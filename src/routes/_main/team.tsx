import { createFileRoute } from '@tanstack/react-router';

import { CrumbLink } from 'src/layouts/main/app-breadcrumbs';
import { TeamPage } from 'src/pages/team/team.page';

export const Route = createFileRoute('/_main/team')({
  component: TeamPage,

  beforeLoad: () => ({
    breadcrumb: () => <CrumbLink to={Route.fullPath} />,
  }),
});
