import { createFileRoute } from '@tanstack/react-router';

import { SecretsPage } from 'src/pages/secrets/secrets.page';

export const Route = createFileRoute('/_main/secrets')({
  component: SecretsPage,
});
