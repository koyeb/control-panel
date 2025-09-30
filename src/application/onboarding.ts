import { useOrganizationUnsafe, useUserUnsafe } from 'src/api';
import { OnboardingStep, Organization, User } from 'src/model';

export function useOnboardingStep() {
  const user = useUserUnsafe();
  const organization = useOrganizationUnsafe();

  return getOnboardingStep(user, organization);
}

export function getOnboardingStep(
  user: User | undefined,
  organization: Organization | undefined,
): OnboardingStep | null {
  if (user === undefined) {
    return null;
  }

  if (!user.emailValidated) {
    return 'emailValidation';
  }

  if (organization === undefined) {
    return 'joinOrganization';
  }

  if (!organization.hasSignupQualification && organization.plan !== 'partner_csp_unit') {
    return 'qualification';
  }

  if (organization.statusMessage === 'PLAN_UPGRADE_REQUIRED') {
    return 'paymentMethod';
  }

  if (organization.statusMessage === 'PENDING_VERIFICATION') {
    return 'automaticReview';
  }

  if (organization.status === 'WARNING') {
    // transient state after creating another organization
    if (organization.statusMessage === 'REVIEWING_ACCOUNT') {
      return 'automaticReview';
    }
  }

  return null;
}
