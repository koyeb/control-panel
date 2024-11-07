import { useOrganization } from 'src/api/hooks/session';

import { BillingInformation } from './billing-information';
import { Coupon } from './coupon';
import { StripePortal } from './stripe-portal';
import { Usage } from './usage';

export function BillingPage() {
  const organization = useOrganization();

  return (
    <>
      <Usage />
      <StripePortal />
      {organization.plan !== 'hobby' && <Coupon />}
      <BillingInformation />
    </>
  );
}
