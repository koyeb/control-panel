import { useOrganizationQuery, useUserQuery } from 'src/api/hooks/session';
import { OnboardingStep, Organization, User } from 'src/api/model';

export function useOnboardingStep() {
  const userQuery = useUserQuery();
  const organizationQuery = useOrganizationQuery();

  return getOnboardingStep(userQuery.data ?? null, organizationQuery.data ?? null);
}

function getOnboardingStep(user: User | null, organization: Organization | null): OnboardingStep | null {
  if (user && !user.emailValidated) {
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
