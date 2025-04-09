import { Alert, ButtonColor } from '@koyeb/design-system';
import { useDeployment } from 'src/api/hooks/service';
import { Service } from 'src/api/model';
import { routes } from 'src/application/routes';
import { isUpcomingDeployment } from 'src/application/service-functions';
import { Link, LinkButton } from 'src/components/link';
import { useSearchParam } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';
import { shortId } from 'src/utils/strings';

const T = createTranslate('pages.service.overview.serviceErrorAlert');

const deploymentLink = (serviceId: string, deploymentId: string) => {
  return routes.service.overview(serviceId, deploymentId);
};

type ServiceErrorAlertProps = {
  service: Service;
};

export function ServiceErrorAlert({ service }: ServiceErrorAlertProps) {
  const { latestDeploymentId, activeDeploymentId } = service;
  const latestDeployment = useDeployment(latestDeploymentId);

  if (latestDeployment === undefined || isUpcomingDeployment(latestDeployment)) {
    return null;
  }

  if (service.status === 'UNHEALTHY') {
    return <ServiceUnhealthyAlert serviceId={service.id} latestDeploymentId={latestDeploymentId} />;
  }

  if (service.status === 'DEGRADED' && activeDeploymentId !== undefined) {
    return (
      <ServiceDegradedAlert
        serviceId={service.id}
        activeDeploymentId={activeDeploymentId}
        latestDeploymentId={latestDeploymentId}
      />
    );
  }

  return null;
}

type ServiceUnhealthyAlertProps = {
  serviceId: string;
  latestDeploymentId: string;
};

function ServiceUnhealthyAlert({ serviceId, latestDeploymentId }: ServiceUnhealthyAlertProps) {
  return (
    <Alert
      variant="error"
      title={<T id="unhealthy.title" />}
      description={
        <T
          id="unhealthy.description"
          values={{
            latestDeploymentName: shortId(latestDeploymentId),
            latestDeploymentLink: (children) => (
              <Link href={deploymentLink(serviceId, latestDeploymentId)} className="underline">
                {children}
              </Link>
            ),
          }}
        />
      }
    >
      <LatestDeploymentButton color="red" serviceId={serviceId} deploymentId={latestDeploymentId} />
    </Alert>
  );
}

type ServiceDegradedAlertProps = {
  serviceId: string;
  activeDeploymentId: string;
  latestDeploymentId: string;
};

function ServiceDegradedAlert({
  serviceId,
  activeDeploymentId,
  latestDeploymentId,
}: ServiceDegradedAlertProps) {
  return (
    <Alert
      variant="warning"
      title={<T id="degraded.title" />}
      description={
        <T
          id="degraded.description"
          values={{
            activeDeploymentName: shortId(activeDeploymentId),
            activeDeploymentLink: (children) => (
              <Link href={deploymentLink(serviceId, activeDeploymentId)} className="underline">
                {children}
              </Link>
            ),
            latestDeploymentName: shortId(latestDeploymentId),
            latestDeploymentLink: (children) => (
              <Link href={deploymentLink(serviceId, latestDeploymentId)} className="underline">
                {children}
              </Link>
            ),
          }}
        />
      }
    >
      <LatestDeploymentButton color="orange" serviceId={serviceId} deploymentId={latestDeploymentId} />
    </Alert>
  );
}

type LatestDeploymentButtonProps = {
  color: ButtonColor;
  serviceId: string;
  deploymentId: string;
};

function LatestDeploymentButton({ color, serviceId, deploymentId }: LatestDeploymentButtonProps) {
  const [currentDeploymentId] = useSearchParam('deploymentId');

  if (deploymentId === currentDeploymentId) {
    return null;
  }

  return (
    <LinkButton color={color} href={deploymentLink(serviceId, deploymentId)} className="sm:self-center">
      <T id="cta" />
    </LinkButton>
  );
}
