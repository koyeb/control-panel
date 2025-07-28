import { createFileRoute } from '@tanstack/react-router';

import { ActivityPage } from 'src/pages/activity/activity.page';

export const Route = createFileRoute('/_main/activity')({
  component: ActivityPage,
});
