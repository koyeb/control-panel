import { Alert, Button } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';

import { apiMutation, useInvalidateApiQuery, useOrganization } from 'src/api';
import { notify } from 'src/application/notify';
import { getDatabaseServiceReachedQuota } from 'src/application/service-functions';
import { ExternalLink, LinkButton } from 'src/components/link';
import { createTranslate } from 'src/intl/translate';
import { DatabaseDeployment, Service } from 'src/model';

const T = createTranslate('pages.database.layout.alerts');

type DatabaseAlertsProps = {
  service: Service;
  deployment: DatabaseDeployment;
};

export function DatabaseAlerts({ service, deployment }: DatabaseAlertsProps) {
  const reachedQuota = getDatabaseServiceReachedQuota(service, deployment);

  if (service.status === 'PAUSED') {
    return <DatabasePausedAlert service={service} />;
  }

  if (reachedQuota !== undefined) {
    return <QuotaReachedAlert service={service} quota={reachedQuota} />;
  }

  return null;
}

function DatabasePausedAlert({ service }: { service: Service }) {
  const invalidate = useInvalidateApiQuery();
  const t = T.useTranslate();

  const mutation = useMutation({
    ...apiMutation('post /v1/services/{id}/resume', {
      path: { id: service.id },
      query: { skip_build: true },
    }),
    async onSuccess() {
      await invalidate('get /v1/services/{id}', { path: { id: service.id } });
      notify.info(t('databasePaused.resuming'));
    },
  });

  return (
    <Alert variant="info" description={<T id="databasePaused.description" />}>
      <Button color="blue" loading={mutation.isPending} onClick={() => mutation.mutate()} className="ml-auto">
        <T id="databasePaused.resume" />
      </Button>
    </Alert>
  );
}

type QuotaReachedAlertProps = {
  service: Service;
  quota: NonNullable<ReturnType<typeof getDatabaseServiceReachedQuota>>;
};

function QuotaReachedAlert({ service, quota }: QuotaReachedAlertProps) {
  const organization = useOrganization();

  const link = (children: React.ReactNode[]) => (
    <ExternalLink
      openInNewTab
      className="underline"
      href="https://www.koyeb.com/docs/databases#database-instance-types"
    >
      {children}
    </ExternalLink>
  );

  const message = () => {
    if (organization?.plan === 'hobby') {
      return <T id={`quotaReached.hobbyPlan.${quota}`} values={{ link }} />;
    }

    return <T id={`quotaReached.paidPlan.${quota}`} />;
  };

  return (
    <Alert variant="warning" description={message()}>
      {organization?.plan === 'hobby' ? (
        <LinkButton to="/settings/plans" color="orange" className="self-center whitespace-nowrap">
          <T id="quotaReached.upgradePlan" />
        </LinkButton>
      ) : (
        <LinkButton
          to="/database-services/$databaseServiceId/settings"
          params={{ databaseServiceId: service.id }}
          color="orange"
          className="self-center whitespace-nowrap"
        >
          <T id="quotaReached.changeSettings" />
        </LinkButton>
      )}
    </Alert>
  );
}
