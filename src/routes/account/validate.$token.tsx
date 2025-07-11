import { createFileRoute } from '@tanstack/react-router';

import { ValidateAccountPage } from 'src/pages/account/validate-account.page';

export const Route = createFileRoute('/account/validate/$token')({
  component: ValidateAccountPage,
});
