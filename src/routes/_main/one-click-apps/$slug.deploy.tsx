import { createFileRoute } from '@tanstack/react-router';

import { CrumbLink } from 'src/layouts/main/app-breadcrumbs';
import { OneClickAppDeployPage } from 'src/pages/one-click-apps/one-click-app-deploy.page';

export const Route = createFileRoute('/_main/one-click-apps/$slug/deploy')({
  component: function Component() {
    const { slug } = Route.useParams();

    return <OneClickAppDeployPage slug={slug} />;
  },

  beforeLoad: ({ params }) => ({
    breadcrumb: () => <CrumbLink to={Route.fullPath} params={params} />,
  }),
});
