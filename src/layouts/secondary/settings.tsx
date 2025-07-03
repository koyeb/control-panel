import { useOrganizationUnsafe } from 'src/api/hooks/session';
import { IconArrowLeft } from 'src/components/icons';
import { Link } from 'src/components/link';
import { createTranslate } from 'src/intl/translate';
import { DeactivateOrganization } from 'src/modules/account/deactivate-organization';
import { DeleteAccount } from 'src/modules/account/delete-account';
import { DeleteOrganization } from 'src/modules/account/delete-organization';
import { ReactivateOrganization } from 'src/modules/account/reactivate-organization';

const T = createTranslate('layouts.secondary.settings');

export function SecondarySettings() {
  const organization = useOrganizationUnsafe();

  return (
    <div className="mx-auto col w-full max-w-3xl gap-10 px-4 py-8 lg:py-32">
      <div className="col items-start gap-2">
        <Link to="/" className="row items-center gap-1">
          <div>
            <IconArrowLeft className="size-4" />
          </div>
          <T id="back" />
        </Link>

        <div className="typo-heading">
          <T id="title" />
        </div>
      </div>

      {organization && (
        <div className="col gap-2">
          <div className="font-medium">
            <T id="organizationSettings" />
          </div>
          {organization.status === 'DEACTIVATED' ? <ReactivateOrganization /> : <DeactivateOrganization />}
          <DeleteOrganization />
        </div>
      )}

      <div className="col gap-2">
        <div className="font-medium">
          <T id="userSettings" />
        </div>
        <DeleteAccount />
      </div>
    </div>
  );
}
