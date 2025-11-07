import { TabButtons } from '@koyeb/design-system';
import { Outlet, createFileRoute } from '@tanstack/react-router';

import { useService } from 'src/api';
import { TabButtonLink } from 'src/components/link';
import { createTranslate } from 'src/intl/translate';
import { CrumbLink } from 'src/layouts/main/app-breadcrumbs';

const T = createTranslate('pages.sandbox.navigation');

export const Route = createFileRoute('/_main/sandboxes/$serviceId')({
  component: SandboxLayout,

  beforeLoad: ({ params }) => ({
    breadcrumb: () => <Crumb serviceId={params.serviceId} />,
  }),
});

function Crumb({ serviceId }: { serviceId: string }) {
  const service = useService(serviceId);

  return (
    <CrumbLink to={Route.fullPath} params={{ serviceId }}>
      {service?.name}
    </CrumbLink>
  );
}

function SandboxLayout() {
  const { serviceId } = Route.useParams();

  return (
    <div className="col gap-8">
      <TabButtons>
        <TabButtonLink to="/sandboxes/$serviceId" params={{ serviceId }}>
          <T id="overview" />
        </TabButtonLink>

        <TabButtonLink to="/sandboxes/$serviceId/metrics" params={{ serviceId }}>
          <T id="metrics" />
        </TabButtonLink>

        <TabButtonLink to="/sandboxes/$serviceId/console" params={{ serviceId }}>
          <T id="console" />
        </TabButtonLink>
      </TabButtons>

      <Outlet />
    </div>
  );
}
