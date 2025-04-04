import { useOrganizationQuery, useUserQuery } from 'src/api/hooks/session';
import { OnboardingStep, Organization, User } from 'src/api/model';
import { useFeatureFlag } from 'src/hooks/feature-flag';

export function useOnboardingStep() {
  const userQuery = useUserQuery();
  const organizationQuery = useOrganizationQuery();
  const hasAiOnboarding = useFeatureFlag('ai-onboarding');

  return getOnboardingStep(userQuery.data ?? null, organizationQuery.data ?? null, hasAiOnboarding);
}

function getOnboardingStep(
  user: User | null,
  organization: Organization | null,
  hasAiOnboarding?: boolean,
): OnboardingStep | null {
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

  if (hasAiOnboarding && showAiStep(organization)) {
    return 'ai';
  }

  if (organization.status === 'WARNING') {
    // transient state after creating another organization
    if (organization.statusMessage === 'REVIEWING_ACCOUNT') {
      return 'automaticReview';
    }
  }

  return null;
}

function showAiStep(organization: Organization) {
  const { primaryUseCase, aiDeploymentSource } = organization.signupQualification ?? {};

  const isAiUseCase = ['Inference workloads', 'Training and fine-tuning', 'AI agents'].includes(
    primaryUseCase as string,
  );

  return isAiUseCase && aiDeploymentSource === undefined;
}
