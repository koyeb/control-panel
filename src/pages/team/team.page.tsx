import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@workos-inc/authkit-react';
import { UsersManagement } from '@workos-inc/widgets';
import { lazy } from 'react';

import { apiQuery, useOrganizationQuotas } from 'src/api';
import { Title } from 'src/components/title';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.team');

const WorkOSWidgetsProvider = lazy(() => import('src/components/workos-widgets-provider'));

export function TeamPage() {
  return (
    <div className="col gap-4">
      <Title title={<T id="title" />} />
      <WorkOSUsersManagement />
    </div>
  );
}

export function WorkOSUsersManagement() {
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
        {!canAddMembers && <style>{hideInviteUserButton}</style>}
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
