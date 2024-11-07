import { BillingInformation } from './billing-information';
import { Coupon } from './coupon';
import { StripePortal } from './stripe-portal';
import { Usage } from './usage';

export function BillingPage() {
  return (
    <>
      <Usage />
      <StripePortal />
      <Coupon />
      <BillingInformation />
    </>
  );
}
