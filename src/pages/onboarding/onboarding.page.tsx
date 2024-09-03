import { OnboardingStep } from 'src/api/model';
import { useSearchParams } from 'src/hooks/router';
import { SecondaryLayout } from 'src/layouts/secondary/secondary-layout';

import { AutomaticReview } from './automatic-review';
import { EmailValidation } from './email-validation';
import { JoinOrganization } from './join-organization';
import { PaymentMethod } from './payment-method';
import { Qualification } from './qualification';
import { Settings } from './settings';

export function OnboardingPage({ step }: { step: OnboardingStep }) {
  const params = useSearchParams();

  if (params.has('settings')) {
    return (
      <SecondaryLayout>
        <Settings />
      </SecondaryLayout>
    );
  }

  return (
    <SecondaryLayout>
      {step === 'emailValidation' && <EmailValidation />}
      {step === 'joinOrganization' && <JoinOrganization />}
      {step === 'qualification' && <Qualification />}
      {step === 'paymentMethod' && <PaymentMethod />}
      {step === 'automaticReview' && <AutomaticReview />}
    </SecondaryLayout>
  );
}
