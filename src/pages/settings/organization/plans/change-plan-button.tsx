import { useMutation } from '@tanstack/react-query';
import { useRef } from 'react';

import { Button, Tooltip } from '@koyeb/design-system';
import { useOrganization } from 'src/api/hooks/session';
import { OrganizationPlan } from 'src/api/model';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { Dialog } from 'src/components/dialog';
import { ExternalLinkButton } from 'src/components/link';
import { UpgradeDialog } from 'src/components/payment-form';
import { createTranslate, TranslateEnum } from 'src/intl/translate';

type Plan = Extract<OrganizationPlan, 'starter' | 'pro' | 'scale' | 'enterprise'>;

const T = createTranslate('pages.organizationSettings.plans');

export function ChangePlanButton({ plan }: { plan: Plan }) {
  const organization = useOrganization();
  const oldPlan = useRef(organization.plan);

  const openDialog = Dialog.useOpen();
  const closeDialog = Dialog.useClose();

  const onPlanChanged = () => {
    closeDialog();
    notify.success(<PlanChangedNotification oldPlan={oldPlan.current} newPlan={plan} />);
  };

  const mutation = useChangePlan(onPlanChanged);

  const onChangePlan = () => {
    if (organization.hasPaymentMethod) {
      mutation.mutate(plan);
    } else {
      openDialog(`Upgrade-${plan}`);
    }
  };

  const text = () => {
    if (organization.plan === plan) {
      return <T id="currentPlan" />;
    }

    if (organization.plan === 'startup') {
      return <T id="select" />;
    }

    if (isUpgrade(organization.plan, plan)) {
      return <T id="upgrade" />;
    }

    return <T id="downgrade" />;
  };

  return (
    <>
      <Tooltip content={organization.plan === 'enterprise' && plan !== 'enterprise' && <T id="contactUs" />}>
        {(props) => (
          <div {...props}>
            <Button
              disabled={organization.plan === plan || organization.plan === 'enterprise'}
              className="w-full"
              loading={mutation.isPending}
              onClick={onChangePlan}
            >
              {text()}
            </Button>
          </div>
        )}
      </Tooltip>

      <UpgradeDialog
        plan={plan}
        onPlanChanged={onPlanChanged}
        title={<T id="upgradeDialog.title" values={{ plan: <TranslateEnum enum="plans" value={plan} /> }} />}
        submit={<T id="upgradeDialog.submit" />}
      />
    </>
  );
}

export function ChangePlanEnterpriseButton() {
  const organization = useOrganization();

  return (
    <ExternalLinkButton
      openInNewTab
      href="https://app.reclaim.ai/m/koyeb-intro/short-call"
      disabled={organization.plan === 'enterprise'}
      className="w-full"
    >
      {organization.plan === 'enterprise' ? <T id="currentPlan" /> : <T id="upgradeEnterprise" />}
    </ExternalLinkButton>
  );
}

function PlanChangedNotification({ oldPlan, newPlan }: { oldPlan: OrganizationPlan; newPlan: Plan }) {
  const planName = <T id={`plans.${newPlan}.name`} />;

  return (
    <>
      <strong>
        <T id="planChangedNotification.title" values={{ plan: planName }} />
      </strong>

      <div>
        <T
          id="planChangedNotification.details"
          values={{ upgraded: isUpgrade(oldPlan, newPlan), plan: planName }}
        />
      </div>
    </>
  );
}

function useChangePlan(onSuccess: () => void) {
  const organization = useOrganization();
  const invalidate = useInvalidateApiQuery();

  return useMutation({
    ...useApiMutationFn('changePlan', (plan: Plan) => ({
      path: { id: organization.id },
      body: { plan },
    })),
    async onSuccess() {
      await invalidate('getCurrentOrganization');
      onSuccess();
    },
  });
}

function isUpgrade(prevPlan: OrganizationPlan, nextPlan: OrganizationPlan) {
  const plans: OrganizationPlan[] = ['hobby', 'starter', 'startup', 'pro', 'scale', 'enterprise', 'business'];
  const prevPlanIndex = plans.indexOf(prevPlan);
  const nextPlanIndex = plans.indexOf(nextPlan);

  return nextPlanIndex > prevPlanIndex;
}
