import { OnboardingStep } from 'src/api/model';
import { FullScreenLayout } from 'src/layouts/onboarding/full-screen-layout';
import { OnboardingLayout } from 'src/layouts/onboarding/onboarding-layout';

import { AutomaticReview } from './automatic-review';
import { EmailValidation } from './email-validation';
import { JoinOrganization } from './join-organization';
import { PaymentMethod } from './payment-method';
import { Qualification } from './qualification';

export function OnboardingPage({ step }: { step: OnboardingStep }) {
  if (step === 'emailValidation' || step === 'joinOrganization') {
    return (
      <FullScreenLayout>
        {step === 'emailValidation' && <EmailValidation />}
        {step === 'joinOrganization' && <JoinOrganization />}
      </FullScreenLayout>
    );
  }

  return (
    <OnboardingLayout>
      {step === 'qualification' && <Qualification />}
      {step === 'paymentMethod' && <PaymentMethod />}
      {step === 'automaticReview' && <AutomaticReview />}
    </OnboardingLayout>
  );
}
