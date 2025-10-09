import { Button } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';

import { apiMutation, useInvalidateApiQuery, useOrganization } from 'src/api';
import { notify } from 'src/application/notify';
import { closeDialog, openDialog } from 'src/components/dialog';
import { ExternalLinkButton } from 'src/components/link';
import { Tooltip } from 'src/components/tooltip';
import { tallyForms, useTallyLink } from 'src/hooks/tally';
import { TranslateEnum, createTranslate } from 'src/intl/translate';
import { OrganizationPlan } from 'src/model';

type Plan = Extract<OrganizationPlan, 'starter' | 'pro' | 'scale' | 'enterprise'>;

const T = createTranslate('pages.organizationSettings.plans');

export function ChangePlanButton({ plan }: { plan: Plan }) {
  const organization = useOrganization();

  const onPlanChanged = () => {
    closeDialog();
    notify.success(<PlanChangedNotification plan={plan} />);
  };

  const mutation = useChangePlan(onPlanChanged);

  const onChangePlan = () => {
    if (organization?.hasPaymentMethod) {
      mutation.mutate(plan);
    } else {
      openDialog('Upgrade', {
        plan,
        title: <T id="upgradeDialog.title" values={{ plan: <TranslateEnum enum="plans" value={plan} /> }} />,
        submit: <T id="upgradeDialog.submit" />,
        onPlanChanged,
      });
    }
  };

  const text = () => {
    if (organization?.trial || organization?.plan === 'startup') {
      return <T id="select" />;
    }

    if (organization?.plan === plan) {
      return <T id="currentPlan" />;
    }

    if (isUpgrade(organization?.plan, plan)) {
      return <T id="upgrade" />;
    }

    return <T id="downgrade" />;
  };

  const disabled = () => {
    if (organization?.trial) {
      return false;
    }

    return organization?.plan === plan || organization?.plan === 'enterprise';
  };

  return (
    <Tooltip
      mobile={false}
      content={organization?.plan === 'enterprise' && plan !== 'enterprise' && <T id="contactUs" />}
      trigger={(props) => (
        <div {...props}>
          <Button
            disabled={disabled()}
            loading={mutation.isPending}
            onClick={onChangePlan}
            className="w-full"
          >
            {text()}
          </Button>
        </div>
      )}
    />
  );
}

export function ChangePlanEnterpriseButton() {
  const organization = useOrganization();
  const tallyLink = useTallyLink(tallyForms.getInTouch);

  return (
    <ExternalLinkButton
      openInNewTab
      href={tallyLink}
      disabled={organization?.plan === 'enterprise'}
      className="w-full"
    >
      {organization?.plan === 'enterprise' ? <T id="currentPlan" /> : <T id="upgradeEnterprise" />}
    </ExternalLinkButton>
  );
}

function PlanChangedNotification({ plan }: { plan: Plan }) {
  return (
    <>
      <strong>
        <T id="planChangedNotification.title" values={{ plan: <T id={`plans.${plan}.name`} /> }} />
      </strong>

      <div>
        <T id="planChangedNotification.details" />
      </div>
    </>
  );
}

function useChangePlan(onSuccess: () => void) {
  const organization = useOrganization();
  const invalidate = useInvalidateApiQuery();

  return useMutation({
    ...apiMutation('post /v1/organizations/{id}/plan', (plan: Plan) => ({
      path: { id: organization!.id },
      body: { plan },
    })),
    async onSuccess() {
      await invalidate('get /v1/account/organization');
      onSuccess();
    },
  });
}

function isUpgrade(prevPlan: OrganizationPlan | undefined, nextPlan: OrganizationPlan | undefined) {
  const plans: OrganizationPlan[] = ['hobby', 'starter', 'startup', 'pro', 'scale', 'enterprise', 'business'];
  const prevPlanIndex = plans.indexOf(prevPlan as OrganizationPlan);
  const nextPlanIndex = plans.indexOf(nextPlan as OrganizationPlan);

  return nextPlanIndex > prevPlanIndex;
}
