import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import { useState } from 'react';

import { Button, Table, Tooltip } from '@koyeb/design-system';
import { useOrganization } from 'src/api/hooks/session';
import { OrganizationPlan } from 'src/api/model';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { IconSlash, IconArrowRight } from 'src/components/icons';
import { PaymentDialog } from 'src/components/payment-form';
import { SectionHeader } from 'src/components/section-header';
import { Translate } from 'src/intl/translate';

type Plan = 'starter' | 'startup' | 'enterprise';

const T = Translate.prefix('pages.organizationSettings.plans');

export function PlansPage() {
  return (
    <div className="col gap-6 overflow-x-auto">
      <SectionHeader title={<T id="title" />} description={<T id="description" />} />
      <PlansTable />
    </div>
  );
}

type PlansTableRow = {
  id: React.Key;
  label: React.ReactNode;
  starter: React.ReactNode;
  startup: React.ReactNode;
  enterprise: React.ReactNode;
};

function PlansTable() {
  const rows: PlansTableRow[] = [
    createRow('maxOrganizationMembers'),
    createRow('regions'),
    createRow('customDomains'),
    createRow('apps'),
    createRow('services'),
    createRow('maximumMemory'),
    createRow('concurrentBuilds'),
    createRow('logRetention'),
    createRow('instances'),
    createRow('bandwidth'),
    createRow('support'),
    createRow('sla'),
    createRow('securityCompliance'),
  ];

  return (
    <Table
      items={rows}
      columns={{
        label: {
          headerClassName: clsx('min-w-48'),
          render: ({ label }) => label,
        },
        starter: {
          header: <PlanHeader plan="starter" />,
          render: ({ starter }) => starter,
        },
        startup: {
          header: <PlanHeader plan="startup" />,
          render: ({ startup }) => startup,
        },
        enterprise: {
          header: <PlanHeader plan="enterprise" />,
          render: ({ enterprise }) => enterprise,
        },
      }}
    />
  );
}

function PlanHeader({ plan }: { plan: Plan }) {
  const organization = useOrganization();
  const invalidate = useInvalidateApiQuery();

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const showPlanChangedNotification = usePlanChangedNotification(plan);

  const { mutate: changePlan, isPending } = useMutation({
    ...useApiMutationFn('changePlan', (plan: Plan) => ({
      path: { id: organization.id },
      body: { plan },
    })),
    async onSuccess() {
      await invalidate('getCurrentOrganization');
      showPlanChangedNotification();
    },
  });

  const onChangePlan = () => {
    if (plan === 'enterprise') {
      window.open('https://app.reclaim.ai/m/koyeb-intro/short-call');
    } else if (organization.hasPaymentMethod) {
      changePlan(plan);
    } else {
      setPaymentDialogOpen(true);
    }
  };

  function changePlanText() {
    if (organization.plan === plan) {
      return <T id="currentPlan" />;
    }

    if (plan === 'enterprise') {
      return <T id="upgradeEnterprise" />;
    }

    if (isUpgrade(organization.plan, plan)) {
      return <T id="upgrade" />;
    }

    return <T id="downgrade" />;
  }

  return (
    <div className="col items-start gap-4">
      <div className="col gap-1 font-medium">
        <div className="row items-center">
          <div className="text-default">
            <T id={`${plan}.displayName`} />
          </div>

          <IconSlash className="h-3" />

          <div className="self-end text-xs text-dim">
            <T id={`${plan}.planPrice`} />
          </div>
        </div>

        <div className="text-xs text-dim">
          <T id={`${plan}.planDetails`} />
        </div>
      </div>

      <Tooltip content={organization.plan === 'enterprise' && plan !== 'enterprise' && <T id="contactUs" />}>
        {(props) => (
          <div {...props}>
            <Button
              disabled={plan === organization.plan || organization.plan === 'enterprise'}
              loading={isPending}
              onClick={onChangePlan}
            >
              {changePlanText()}
              <IconArrowRight />
            </Button>
          </div>
        )}
      </Tooltip>

      <PaymentDialog
        plan={plan}
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        onPlanChanged={() => {
          setPaymentDialogOpen(false);
          showPlanChangedNotification();
        }}
        title={<T id="paymentDialog.title" values={{ plan: <span className="capitalize">{plan}</span> }} />}
        description={null}
        submit={<T id="paymentDialog.submit" />}
      />
    </div>
  );
}

function usePlanChangedNotification(plan: Plan) {
  const organization = useOrganization();
  const t = T.useTranslate();

  return () => {
    notify.success(
      <>
        <strong>{t('paymentDialog.successNotification.title', { plan: t(`${plan}.displayName`) })}</strong>

        <div>
          <T
            id="paymentDialog.successNotification.details"
            values={{ upgraded: isUpgrade(organization.plan, plan), plan: t(`${plan}.displayName`) }}
          />
        </div>
      </>,
    );
  };
}

function isUpgrade(prevPlan: OrganizationPlan, nextPlan: OrganizationPlan) {
  const plans: OrganizationPlan[] = ['hobby', 'starter', 'startup', 'enterprise'];
  const prevPlanIndex = plans.indexOf(prevPlan);
  const nextPlanIndex = plans.indexOf(nextPlan);

  return nextPlanIndex > prevPlanIndex;
}

type PlanRow =
  | 'maxOrganizationMembers'
  | 'regions'
  | 'customDomains'
  | 'apps'
  | 'services'
  | 'maximumMemory'
  | 'concurrentBuilds'
  | 'logRetention'
  | 'instances'
  | 'bandwidth'
  | 'support'
  | 'sla'
  | 'securityCompliance';

function createRow(row: PlanRow) {
  const label = (
    <>
      <div className="font-medium">
        <T id={row} />
      </div>

      {(row === 'customDomains' || row === 'bandwidth') && (
        <div className="text-xs text-dim">
          <T id={`${row}Details`} />
        </div>
      )}
    </>
  );

  return {
    id: row,
    label,
    starter: <T id={`starter.${row}`} />,
    startup: <T id={`startup.${row}`} />,
    enterprise: <T id={`enterprise.${row}`} />,
  };
}
