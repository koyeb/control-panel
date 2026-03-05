import { useOrganization } from 'src/api';
import { FeatureFlag } from 'src/hooks/feature-flag';
import { DeactivateOrganization } from 'src/modules/account/deactivate-organization';
import { DeleteOrganization } from 'src/modules/account/delete-organization';
import { ReactivateOrganization } from 'src/modules/account/reactivate-organization';

import { DefaultProject } from './default-project';
import { OrganizationName } from './organization-name';
import { OrganizationQuotas } from './organization-quotas';

export function GeneralSettingsPage() {
  const organization = useOrganization();

  return (
    <>
      <OrganizationName />
      <OrganizationQuotas />
      <FeatureFlag feature="simple-projects">
        <DefaultProject key={organization?.id} />
      </FeatureFlag>
      <DangerZone />
    </>
  );
}

function DangerZone() {
  const organization = useOrganization();

  return (
    <>
      {organization?.status !== 'DEACTIVATED' && <DeactivateOrganization />}
      {organization?.status === 'DEACTIVATED' && <ReactivateOrganization />}
      <DeleteOrganization />
    </>
  );
}
