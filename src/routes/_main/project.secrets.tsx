import { createFileRoute } from '@tanstack/react-router';

import { useCurrentProjectId } from 'src/api/hooks/project';
import { FeatureFlag } from 'src/hooks/feature-flag';
import { createTranslate } from 'src/intl/translate';
import { CrumbLink } from 'src/layouts/main/app-breadcrumbs';
import { SecretsPage } from 'src/pages/secrets/secrets.page';

const T = createTranslate('pages.secrets');

export const Route = createFileRoute('/_main/project/secrets')({
  component: RouteComponent,

  beforeLoad: () => ({
    breadcrumb: () => <CrumbLink to={Route.to} />,
  }),
});

function RouteComponent() {
  const t = T.useTranslate();
  const [projectId] = useCurrentProjectId();

  return (
    <FeatureFlag feature="simple-projects">
      <SecretsPage key={projectId} title={<T id="projectTitle" />} documentTitle={t('projectTitle')} />
    </FeatureFlag>
  );
}
