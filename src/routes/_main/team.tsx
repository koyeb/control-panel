import { Alert } from '@koyeb/design-system';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '@workos-inc/authkit-react';
import { UsersManagement } from '@workos-inc/widgets';
import { lazy } from 'react';

import { apiQuery, useOrganizationQuotas } from 'src/api';
import { Title } from 'src/components/title';
import { createTranslate } from 'src/intl/translate';
import { CrumbLink } from 'src/layouts/main/app-breadcrumbs';

const WorkOSWidgetsProvider = lazy(() => import('src/components/workos-widgets-provider'));

export const Route = createFileRoute('/_main/team')({
  component: TeamPage,

  beforeLoad: () => ({
    breadcrumb: () => <CrumbLink to={Route.to} />,
  }),
});

const T = createTranslate('pages.team');

function TeamPage() {
  return (
    <div className="col gap-4">
      <Title title={<T id="title" />} />
      <WorkOSUsersManagement />
    </div>
  );
}

function WorkOSUsersManagement() {
  const { getAccessToken } = useAuth();

  const { data: membersCount = 0 } = useQuery({
    ...apiQuery('get /v1/organization_members', {}),
    select: ({ count }) => count!,
  });

  const quotas = useOrganizationQuotas();
  const canAddMembers = membersCount < quotas.maxOrganizationMembers;

  return (
    <WorkOSWidgetsProvider>
      <div className="mt-4 col gap-4">
        {!canAddMembers && (
          <>
            <style>{hideInviteUserButton}</style>
            <Alert description={<T id="upgradeToInvite" />} />
          </>
        )}

        <UsersManagement authToken={getAccessToken} />
      </div>
    </WorkOSWidgetsProvider>
  );
}

// cspell:ignore woswidgets
const hideInviteUserButton = `
.woswidgets-button.button--primary {
  display: none;
}`.trim();
