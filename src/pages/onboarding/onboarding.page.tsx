import { Fragment } from 'react/jsx-runtime';

import { FullScreenLayout } from 'src/layouts/onboarding/full-screen-layout';
import { OnboardingStep } from 'src/model';

import { AutomaticReview } from './automatic-review';
import { EmailValidation } from './email-validation';
import { JoinOrganization } from './join-organization';
import { PaymentMethod } from './payment-method';
import { Qualification } from './qualification';
import { SetUserName } from './set-user-name';

export function OnboardingPage({ step }: { step: OnboardingStep }) {
  const Wrapper = step === 'emailValidation' || step === 'automaticReview' ? FullScreenLayout : Fragment;

  return (
    <Wrapper>
      {step === 'emailValidation' && <EmailValidation />}
      {step === 'setUserName' && <SetUserName />}
      {step === 'joinOrganization' && <JoinOrganization />}
      {step === 'qualification' && <Qualification />}
      {step === 'automaticReview' && <AutomaticReview />}
      {step === 'paymentMethod' && <PaymentMethod />}
    </Wrapper>
  );
}
