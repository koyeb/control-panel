import { createFileRoute } from '@tanstack/react-router';
import { getBreadcrumb } from 'src/layouts/main/app-breadcrumbs';
import { SecretsPage } from 'src/pages/secrets/secrets.page';

export const Route = createFileRoute('/_main/secrets')({
  component: SecretsPage,

  loader: ({ context, location }) => {
    context.breadcrumb = getBreadcrumb(location, 'secrets');
  },
});
