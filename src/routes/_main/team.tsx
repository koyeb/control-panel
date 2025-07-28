import { createFileRoute } from '@tanstack/react-router';

import { TeamPage } from 'src/pages/team/team.page';

export const Route = createFileRoute('/_main/team')({
  component: TeamPage,
});
