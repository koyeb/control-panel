import { createFileRoute } from '@tanstack/react-router';

import { CannySsoPage } from 'src/pages/authentication/sso.pages';

export const Route = createFileRoute('/auth/sso/canny')({
  component: CannySsoPage,
});
