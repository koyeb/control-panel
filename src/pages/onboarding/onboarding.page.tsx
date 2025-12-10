import { Fragment } from 'react/jsx-runtime';

import { LogoLoading } from 'src/components/logo-loading';
import { FullScreenLayout } from 'src/layouts/onboarding/full-screen-layout';
import { OnboardingStep } from 'src/model';

import { AutomaticReview } from './automatic-review';
import { JoinOrganization } from './join-organization';
import { PaymentMethod } from './payment-method';
import { Qualification } from './qualification';
import { SetUserName } from './set-user-name';

export function OnboardingPage({ step }: { step: OnboardingStep }) {
  const Wrapper = step === 'automaticReview' ? FullScreenLayout : Fragment;

  return (
    <Wrapper>
      {step === 'emailValidation' && <LogoLoading />}
      {step === 'setUserName' && <SetUserName />}
      {step === 'joinOrganization' && <JoinOrganization />}
      {step === 'qualification' && <Qualification />}
      {step === 'automaticReview' && <AutomaticReview />}
      {step === 'paymentMethod' && <PaymentMethod />}
    </Wrapper>
  );
}
