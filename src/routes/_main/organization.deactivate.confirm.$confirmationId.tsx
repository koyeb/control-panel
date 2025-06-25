import { createFileRoute, useParentMatches } from '@tanstack/react-router';
import { ConfirmDeactivateOrganization } from 'src/modules/account/confirm-deactivate-organization';

export const Route = createFileRoute('/_main/organization/deactivate/confirm/$confirmationId')({
  component: function Component() {
    const { onboardingStep } = useParentMatches().find((route) => route.routeId === '/_main')!.loaderData!;

    return (
      <ConfirmDeactivateOrganization confirmationId="" redirect={onboardingStep ? '/?settings' : undefined} />
    );
  },
});
