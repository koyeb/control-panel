import { useMutation } from '@tanstack/react-query';

import { Alert, Button } from '@koyeb/design-system';
import { useOrganization } from 'src/api/hooks/session';
import { DatabaseDeployment, Service } from 'src/api/model';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { routes } from 'src/application/routes';
import { ExternalLink, LinkButton } from 'src/components/link';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('pages.database.layout.alerts');

type DatabaseAlertsProps = {
  service: Service;
  deployment: DatabaseDeployment;
};

export function DatabaseAlerts({ service, deployment }: DatabaseAlertsProps) {
  if (service.status === 'paused') {
    return <DatabasePausedAlert service={service} />;
  }

  if (deployment.reachedQuota !== undefined) {
    return <QuotaReachedAlert service={service} quota={deployment.reachedQuota} />;
  }

  return null;
}

function DatabasePausedAlert({ service }: { service: Service }) {
  const invalidate = useInvalidateApiQuery();
  const t = T.useTranslate();

  const mutation = useMutation({
    ...useApiMutationFn('resumeService', {
      path: { id: service.id },
    }),
    async onSuccess() {
      await invalidate('getService', { path: { id: service.id } });
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
  quota: Exclude<DatabaseDeployment['reachedQuota'], undefined>;
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
    if (organization.plan === 'hobby') {
      return <T id={`quotaReached.hobbyPlan.${quota}`} values={{ link }} />;
    }

    return <T id={`quotaReached.paidPlan.${quota}`} />;
  };

  return (
    <Alert variant="warning" description={message()}>
      {organization.plan === 'hobby' ? (
        <LinkButton
          href={routes.organizationSettings.plans()}
          color="orange"
          className="self-center whitespace-nowrap"
        >
          <T id="quotaReached.upgradePlan" />
        </LinkButton>
      ) : (
        <LinkButton
          href={routes.database.settings(service.id)}
          color="orange"
          className="self-center whitespace-nowrap"
        >
          <T id="quotaReached.changeSettings" />
        </LinkButton>
      )}
    </Alert>
  );
}
