import { FeatureFlag } from 'src/hooks/feature-flag';

import { BillingInformation } from './billing-information';
import { Coupon } from './coupon';
import { StripePortal } from './stripe-portal';
import { Usage } from './usage';

export function BillingPage() {
  return (
    <>
      <Usage />
      <StripePortal />
      <FeatureFlag feature="coupons">
        <Coupon />
      </FeatureFlag>
      <BillingInformation />
    </>
  );
}
