import { createFileRoute } from '@tanstack/react-router';

import { CrumbLink } from 'src/layouts/main/app-breadcrumbs';
import { OneClickAppsCategoryPage } from 'src/pages/one-click-apps/one-click-apps-category.page';

export const Route = createFileRoute('/_main/one-click-apps/category/$category')({
  component: function Component() {
    const { category } = Route.useParams();

    return <OneClickAppsCategoryPage category={category} />;
  },

  beforeLoad: ({ params }) => ({
    breadcrumb: () => (
      <CrumbLink to={Route.fullPath} params={{ category: params.category }}>
        {params.category}
      </CrumbLink>
    ),
  }),
});
