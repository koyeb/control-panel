import { Badge, Tooltip } from '@koyeb/design-system';
import { App, ComputeDeployment, Service } from 'src/api/model';
import { ServiceUrl, getServiceUrls } from 'src/application/service-functions';
import { CopyIconButton } from 'src/components/copy-icon-button';
import { IconArrowRight } from 'src/components/icons';
import { Metadata } from 'src/components/metadata';
import { createTranslate, Translate } from 'src/intl/translate';
import { assert } from 'src/utils/assert';

const T = createTranslate('modules.deployment.deploymentInfo');

type TcpProxyUrlProps = {
  app: App;
  service: Service;
  deployment: ComputeDeployment;
};

export function TcpProxyUrl({ app, service, deployment }: TcpProxyUrlProps) {
  const urls = getServiceUrls(app, service, deployment).filter((url) => url.tcpProxyUrl !== undefined);

  if (urls.length === 0) {
    return null;
  }

  return <Metadata label={<T id="tcpProxyUrlLabel" />} value={<TcpProxyUrlValue urls={urls} />} />;
}

function TcpProxyUrlValue({ urls: [firstUrl, ...urls] }: { urls: ServiceUrl[] }) {
  const url = firstUrl?.tcpProxyUrl;
  assert(url !== undefined);

  return (
    <div className="row min-w-0 items-center gap-2">
      <div className="max-w-64 truncate">{url}</div>

      <span className="hidden text-dim sm:inline">
        <T id="tcpProxyUrlValueForwardedPort" values={{ portNumber: firstUrl?.portNumber }} />
      </span>

      <CopyIconButton text={url} className="size-em" />

      {urls.length > 0 && (
        <Tooltip content={<UrlsList urls={urls} />}>
          {(props) => (
            <Badge size={1} {...props}>
              <Translate id="common.plusCount" values={{ count: urls.length }} />
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
