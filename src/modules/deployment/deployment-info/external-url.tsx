import { Badge, Tooltip } from '@koyeb/design-system';
import { App, ComputeDeployment, Service } from 'src/api/model';
import { CopyIconButton } from 'src/components/copy-icon-button';
import { ServiceUrl, getServiceUrls } from 'src/application/service-functions';
import { IconArrowRight } from 'src/components/icons';
import { ExternalLink } from 'src/components/link';
import { Metadata } from 'src/components/metadata';
import { createTranslate, Translate } from 'src/intl/translate';
import { assert } from 'src/utils/assert';

const T = createTranslate('modules.deployment.deploymentInfo');

type ExternalUrlProps = {
  app: App;
  service: Service;
  deployment: ComputeDeployment;
};

export function ExternalUrl({ app, service, deployment }: ExternalUrlProps) {
  const urls = getServiceUrls(app, service, deployment).filter((url) => url.externalUrl !== undefined);

  if (urls.length === 0) {
    return null;
  }

  return <Metadata label={<T id="externalUrlLabel" />} value={<ExternalUrlValue urls={urls} />} />;
}

function ExternalUrlValue({ urls: [firstUrl, ...urls] }: { urls: ServiceUrl[] }) {
  const url = firstUrl?.externalUrl;
  assert(url !== undefined);

  return (
    <div className="row min-w-0 items-center gap-2">
      <ExternalLink href={`https://${url}`} className="text-link max-w-64 truncate">
        {url}
      </ExternalLink>

      <span className="hidden text-dim sm:inline">
        <T id="externalUrlValueForwardedPort" values={{ portNumber: firstUrl?.portNumber }} />
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
          <ExternalLink href={`https://${url.externalUrl}`} className="row items-center gap-1">
            {url.externalUrl}
            <IconArrowRight className="size-em" />
            {url.portNumber}
          </ExternalLink>
        </li>
      ))}
    </ul>
  );
}
