import { createFileRoute } from '@tanstack/react-router';

import { DiscourseSsoPage } from 'src/pages/authentication/sso.pages';

export const Route = createFileRoute('/auth/sso/discourse')({
  component: DiscourseSsoPage,
});
