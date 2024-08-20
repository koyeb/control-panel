import { BillingInformation } from './billing-information';
import { StripePortal } from './stripe-portal';
import { Usage } from './usage';

export function BillingPage() {
  return (
    <>
      <Usage />
      <StripePortal />
      <BillingInformation />
    </>
  );
}
