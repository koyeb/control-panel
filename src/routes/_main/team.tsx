import { createFileRoute } from '@tanstack/react-router';
import { getBreadcrumb } from 'src/layouts/main/app-breadcrumbs';
import { TeamPage } from 'src/pages/team/team.page';

export const Route = createFileRoute('/_main/team')({
  component: TeamPage,

  loader: ({ context, location }) => {
    context.breadcrumb = getBreadcrumb(location, 'team');
  },
});
