import { Badge } from '@koyeb/design-system';

import { ServiceUrl, getServiceUrls } from 'src/application/service-functions';
import { CopyIconButton } from 'src/components/copy-icon-button';
import { Metadata } from 'src/components/metadata';
import { Tooltip } from 'src/components/tooltip';
import { useClipboard } from 'src/hooks/clipboard';
import { Translate, createTranslate } from 'src/intl/translate';
import { App, ComputeDeployment, Service } from 'src/model';
import { assert, defined } from 'src/utils/assert';

const T = createTranslate('modules.deployment.deploymentOverview');

type InternalUrlProps = {
  app: App;
  service: Service;
  deployment: ComputeDeployment;
};

export function InternalUrl({ app, service, deployment }: InternalUrlProps) {
  const urls = getServiceUrls(app, service, deployment).filter((url) => url.internalUrl !== undefined);

  if (urls.length === 0) {
    return null;
  }

  return (
    <div className="hidden md:block">
      <Metadata label={<T id="internalUrlLabel" />} value={<InternalUrlValue urls={urls} />} />
    </div>
  );
}

function InternalUrlValue({ urls: [firstUrl, ...urls] }: { urls: ServiceUrl[] }) {
  const url = firstUrl?.internalUrl;
  assert(url !== undefined);

  return (
    <div className="row items-center gap-2">
      <span>{url}</span>

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
  const copy = useClipboard();

  return (
    <ul>
      {urls.map((url) => (
        <li key={url.portNumber}>
          <button type="button" onClick={() => copy(defined(url.internalUrl))}>
            {url.internalUrl}
          </button>
        </li>
      ))}
    </ul>
  );
}
