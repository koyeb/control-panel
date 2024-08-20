import { OnboardingStep } from 'src/api/model';
import { SecondaryLayout } from 'src/layouts/secondary/secondary-layout';
import { SecondaryLayoutTwoTones } from 'src/layouts/secondary/secondary-layout-two-tones';

import { AutomaticReview } from './automatic-review';
import { EmailValidation } from './email-validation';
import { JoinOrganization } from './join-organization';
import { PaymentMethod } from './payment-method';
import { Qualification } from './qualification';

export function OnboardingPage({ step }: { step: OnboardingStep }) {
  const Layout = step === 'paymentMethod' ? SecondaryLayoutTwoTones : SecondaryLayout;

  return (
    <Layout>
      {step === 'emailValidation' && <EmailValidation />}
      {step === 'joinOrganization' && <JoinOrganization />}
      {step === 'qualification' && <Qualification />}
      {step === 'paymentMethod' && <PaymentMethod />}
      {step === 'automaticReview' && <AutomaticReview />}
    </Layout>
  );
}
