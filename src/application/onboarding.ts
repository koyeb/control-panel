import { useUserQuery, useOrganizationQuery } from 'src/api/hooks/session';
import { Organization, OnboardingStep, User } from 'src/api/model';

import { UnexpectedError } from './errors';

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

  if (organization.statusMessage === 'plan_upgrade_required') {
    return 'paymentMethod';
  }

  if (organization.statusMessage === 'pending_verification') {
    return 'automaticReview';
  }

  if (showAiStep(organization)) {
    return 'ai';
  }

  if (organization.status === 'warning') {
    // transient state after creating another organization
    if (organization.statusMessage === 'reviewing_account') {
      return 'automaticReview';
    }

    reportError(
      new UnexpectedError('Unhandled organization status', {
        status: organization.status,
        statusMessage: organization.statusMessage,
      }),
    );
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
