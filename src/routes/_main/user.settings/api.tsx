import { createFileRoute } from '@tanstack/react-router';

import { BaseApiCredentialsPage } from 'src/pages/settings/api-credentials.page';

export const Route = createFileRoute('/_main/user/settings/api')({
  component: () => <BaseApiCredentialsPage type="user" />,
});
