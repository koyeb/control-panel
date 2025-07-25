import { Badge, InfoTooltip, Spinner, Tooltip } from '@koyeb/design-system';

import { App, ComputeDeployment, Deployment, Service } from 'src/api/model';
import { ServiceUrl, getServiceUrls, isUpcomingDeployment } from 'src/application/service-functions';
import { CopyIconButton } from 'src/components/copy-icon-button';
import { Metadata } from 'src/components/metadata';
import { IconArrowRight } from 'src/icons';
import { Translate, createTranslate } from 'src/intl/translate';
import { defined } from 'src/utils/assert';

const T = createTranslate('modules.deployment.deploymentInfo');

type TcpProxyUrlProps = {
  app: App;
  service: Service;
  deployment: ComputeDeployment;
};

export function TcpProxyUrl({ app, service, deployment }: TcpProxyUrlProps) {
  const urls = getServiceUrls(app, service, deployment).filter((url) => url.tcpProxyUrl);

  if (!deployment.definition.ports.some((port) => port.tcpProxy)) {
    return null;
  }

  return (
    <Metadata
      label={<T id="tcpProxyUrl.label" />}
      value={<TcpProxyUrlValue deployment={deployment} urls={urls} />}
    />
  );
}

function TcpProxyUrlValue({ deployment, urls }: { deployment: Deployment; urls: ServiceUrl[] }) {
  if (urls.length === 0) {
    if (isUpcomingDeployment(deployment)) {
      return (
        <Badge size={1} color="blue" className="row gap-2">
          <Spinner className="size-4" />
          <T id="tcpProxyUrl.pending" />
        </Badge>
      );
    }

    return (
      <Badge size={1} color="gray">
        <T id="tcpProxyUrl.unavailable" />
      </Badge>
    );
  }

  const url = defined(urls[0]);

  return (
    <div className="row min-w-0 items-center gap-2">
      <div className="max-w-64 truncate">{url.tcpProxyUrl}</div>

      <span className="hidden text-dim sm:inline">
        <T id="tcpProxyUrl.forwardedPort" values={{ portNumber: url.portNumber }} />
      </span>

      {deployment.status === 'SLEEPING' && (
        <InfoTooltip content={<T id="tcpProxyUrl.deploymentSleeping" />} />
      )}

      <CopyIconButton text={defined(url.tcpProxyUrl)} className="size-em" />

      {urls.length >= 2 && (
        <Tooltip content={<UrlsList urls={urls.slice(1)} />}>
          {(props) => (
            <Badge size={1} {...props}>
              <Translate id="common.plusCount" values={{ count: urls.length - 1 }} />
            </Badge>
          )}
        </Tooltip>
      )}
    </div>
  );
}

function UrlsList({ urls }: { urls: ServiceUrl[] }) {
  return (
    <ul>
      {urls.map((url) => (
        <li key={url.portNumber}>
          <div className="row items-center gap-1">
            {url.tcpProxyUrl}
            <IconArrowRight className="size-em" />
            {url.portNumber}
          </div>
        </li>
      ))}
    </ul>
  );
}
