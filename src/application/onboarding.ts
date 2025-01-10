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

  if (organization.statusMessage === 'plan_upgrade_required') {
    return 'paymentMethod';
  }

  if (organization.statusMessage === 'pending_verification') {
    return 'automaticReview';
  }

  if (hasAiOnboarding && showAiStep(organization)) {
    return 'ai';
  }

  if (organization.status === 'warning') {
    // transient state after creating another organization
    if (organization.statusMessage === 'reviewing_account') {
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
