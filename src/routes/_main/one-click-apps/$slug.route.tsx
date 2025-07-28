import { Outlet, createFileRoute } from '@tanstack/react-router';

import { ApiError } from 'src/api/api-errors';
import { useOneClickAppQuery } from 'src/api/hooks/catalog';
import { TextSkeleton } from 'src/components/skeleton';
import { CrumbLink } from 'src/layouts/main/app-breadcrumbs';

export const Route = createFileRoute('/_main/one-click-apps/$slug')({
  component: Outlet,

  beforeLoad: ({ params }) => ({
    breadcrumb: () => <Breadcrumb slug={params.slug} />,
  }),
});

function Breadcrumb({ slug }: { slug: string }) {
  const app = useOneClickAppQuery(slug);

  if (app.isPending) {
    return <TextSkeleton width={6} />;
  }

  if (app.isError) {
    if (ApiError.is(app.error, 404)) {
      return <>Not found.</>;
    }

    return null;
  }

  return (
    <CrumbLink to={Route.fullPath} params={{ slug }}>
      {app.data.metadata.name}
    </CrumbLink>
  );
}
