import { Badge } from '@koyeb/design-system';

import { ServiceUrl, getServiceUrls } from 'src/application/service-functions';
import { CopyIconButton } from 'src/components/copy-icon-button';
import { ExternalLink } from 'src/components/link';
import { Metadata } from 'src/components/metadata';
import { Tooltip } from 'src/components/tooltip';
import { IconArrowRight } from 'src/icons';
import { Translate, createTranslate } from 'src/intl/translate';
import { App, ComputeDeployment, Service } from 'src/model';
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
      <ExternalLink href={`https://${url}`} className="max-w-64 truncate text-link">
        {url}
      </ExternalLink>

      <span className="hidden text-dim sm:inline">
        <T id="externalUrlValueForwardedPort" values={{ portNumber: firstUrl?.portNumber }} />
      </span>

      <CopyIconButton text={url} className="size-em" />

      {urls.length > 0 && (
        <Tooltip
          allowHover
          content={<UrlsList urls={urls} />}
          trigger={(props) => (
            <Badge size={1} {...props}>
              <Translate id="common.plusCount" values={{ count: urls.length }} />
            </Badge>
          )}
        />
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
