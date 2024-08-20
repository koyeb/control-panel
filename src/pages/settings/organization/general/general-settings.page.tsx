import { useOrganization } from 'src/api/hooks/session';

import { DeactivateOrganization } from './deactivate-organization';
import { DeleteOrganization } from './delete-organization';
import { OrganizationName } from './organization-name';
import { OrganizationQuotas } from './organization-quotas';
import { ReactivateOrganization } from './reactivate-organization';

export function GeneralSettingsPage() {
  return (
    <>
      <OrganizationName />
      <OrganizationQuotas />
      <DangerZone />
    </>
  );
}

function DangerZone() {
  const organization = useOrganization();

  return (
    <>
      {organization.status !== 'deactivated' && <DeactivateOrganization />}
      {organization.status === 'deactivated' && <ReactivateOrganization />}
      <DeleteOrganization />
    </>
  );
}
