import { OnboardingStep } from 'src/api/model';
import { EmailValidationLayout } from 'src/layouts/onboarding/email-validation-layout';
import { SecondaryLayout } from 'src/layouts/secondary/secondary-layout';

import { AiOnboarding } from './ai-onboarding';
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
    <SecondaryLayout>
      {step === 'joinOrganization' && <JoinOrganization />}
      {step === 'qualification' && <Qualification />}
      {step === 'ai' && <AiOnboarding />}
      {step === 'paymentMethod' && <PaymentMethod />}
      {step === 'automaticReview' && <AutomaticReview />}
    </SecondaryLayout>
  );
}
