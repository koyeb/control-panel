import { useOrganization } from 'src/api/hooks/session';
import { DeactivateOrganization } from 'src/modules/account/deactivate-organization';
import { DeleteOrganization } from 'src/modules/account/delete-organization';
import { ReactivateOrganization } from 'src/modules/account/reactivate-organization';

import { OrganizationName } from './organization-name';
import { OrganizationQuotas } from './organization-quotas';

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
      {organization.status !== 'DEACTIVATED' && <DeactivateOrganization />}
      {organization.status === 'DEACTIVATED' && <ReactivateOrganization />}
      <DeleteOrganization />
    </>
  );
}
