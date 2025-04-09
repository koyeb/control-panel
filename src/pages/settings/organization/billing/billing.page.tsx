import { FeatureFlag } from 'src/hooks/feature-flag';

import { BillingInformation } from './billing-information';
import { Coupon } from './coupon';
import { SpendingLimit } from './spending-limit';
import { StripePortal } from './stripe-portal';
import { Usage } from './usage';

export function BillingPage() {
  return (
    <>
      <Usage />
      <StripePortal />
      <FeatureFlag feature="spending-limit">
        <SpendingLimit />
      </FeatureFlag>
      <Coupon />
      <BillingInformation />
    </>
  );
}
