import { OnboardingStep } from 'src/api/model';
import { EmailValidationLayout } from 'src/layouts/onboarding/email-validation-layout';
import { OnboardingLayout } from 'src/layouts/onboarding/onboarding-layout';

import { AutomaticReview } from './automatic-review';
import { EmailValidation } from './email-validation';
import { JoinOrganization } from './join-organization';
import { PaymentMethod } from './payment-method';
import { Qualification } from './qualification';

export function OnboardingPage({ step }: { step: OnboardingStep }) {
  if (step === 'emailValidation') {
    return (
      <EmailValidationLayout>
        <EmailValidation />
      </EmailValidationLayout>
    );
  }

  return (
    <OnboardingLayout>
      {step === 'joinOrganization' && <JoinOrganization />}
      {step === 'qualification' && <Qualification />}
      {step === 'paymentMethod' && <PaymentMethod />}
      {step === 'automaticReview' && <AutomaticReview />}
    </OnboardingLayout>
  );
}
