import { OnboardingStep, Organization, User } from 'src/api/model';

export function getOnboardingStep(user: User, organization: Organization | null): OnboardingStep | null {
  if (!user?.emailValidated) {
    return 'emailValidation';
  }

  if (organization === null) {
    return 'joinOrganization';
  }

  if (!organization.hasSignupQualification) {
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
