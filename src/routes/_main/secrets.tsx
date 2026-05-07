import { createFileRoute } from '@tanstack/react-router';

import { FeatureFlag } from 'src/hooks/feature-flag';
import { CrumbLink } from 'src/layouts/main/app-breadcrumbs';
import { SecretsPage } from 'src/pages/secrets/secrets.page';

export const Route = createFileRoute('/_main/secrets')({
  component: RouteComponent,

  beforeLoad: () => ({
    breadcrumb: () => <CrumbLink to={Route.to} />,
  }),
});

function RouteComponent() {
  return (
    <FeatureFlag feature="simple-projects" fallback={<SecretsPage scope="organization" />}>
      {null}
    </FeatureFlag>
  );
}
