import { createFileRoute } from '@tanstack/react-router';
import { getBreadcrumb } from 'src/layouts/main/app-breadcrumbs';
import { ActivityPage } from 'src/pages/activity/activity.page';

export const Route = createFileRoute('/_main/activity')({
  component: ActivityPage,

  loader: ({ context, location }) => {
    context.breadcrumb = getBreadcrumb(location, 'activity');
  },
});
