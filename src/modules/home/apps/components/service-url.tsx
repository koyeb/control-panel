import { Badge, Tooltip } from '@koyeb/design-system';
import clsx from 'clsx';
import sortBy from 'lodash-es/sortBy';

import { App, Deployment, Service } from 'src/api/model';
import { notify } from 'src/application/notify';
import { ExternalLink } from 'src/components/link';
import { useClipboard } from 'src/hooks/clipboard';
import { IconCopy, IconLink } from 'src/icons';
import { Translate, createTranslate } from 'src/intl/translate';

import { getServiceUrls } from '../../../../application/service-functions';

const T = createTranslate('pages.home');

type ServiceUrlProps = {
  app: App;
  service: Service;
  deployment?: Deployment;
};

export function ServiceUrl({ app, service, deployment }: ServiceUrlProps) {
  const urls = getServiceUrls(app, service, deployment);
  const firstUrl = urls.find((url) => url.externalUrl !== undefined) ?? urls[0];

  if (firstUrl === undefined) {
    return <div />;
  }

  return (
    <div className="row min-w-0 items-center gap-4">
      <UrlElement
        {...firstUrl}
        className="row min-w-0 flex-1 items-center gap-2 !rounded-full border px-3 py-1 hover:bg-muted/50"
      />

      {urls.length >= 2 && (
        <Tooltip allowHover content={<ServiceUrlsList urls={urls} />}>
          {(props) => (
            <Badge {...props} size={1}>
              <Translate id="common.plusCount" values={{ count: urls.length - 1 }} />
            </Badge>
          )}
        </Tooltip>
      )}
    </div>
  );
}

type UrlElementProps = {
  externalUrl?: string;
  internalUrl?: string;
  className?: string;
  urlClassName?: string;
};

function UrlElement({ externalUrl, internalUrl, className, urlClassName }: UrlElementProps) {
  const copy = useClipboard();
  const t = T.useTranslate();

  const url = externalUrl ?? internalUrl;
  const Icon = externalUrl ? IconLink : IconCopy;

  if (url === undefined) {
    return null;
  }

  const children = (
    <>
      <div>
        <Icon className="size-4" />
      </div>
      <div className={clsx('truncate', urlClassName)}>{url}</div>
    </>
  );

  if (externalUrl) {
    return (
      <ExternalLink openInNewTab href={`https://${url}`} className={className}>
        {children}
      </ExternalLink>
    );
  } else {
    const onCopied = () => notify.success(t('copyServiceUrlSuccess'));

    return (
      <button type="button" onClick={() => copy(url, onCopied)} className={className}>
        {children}
      </button>
    );
  }
}

function ServiceUrlsList({ urls }: { urls: Array<{ externalUrl?: string; internalUrl?: string }> }) {
  return (
    <ul>
      {sortBy(urls, 'externalUrl').map((url) => (
        <li key={url.internalUrl}>
          <UrlElement {...url} className="row gap-2 py-1" urlClassName="direction-rtl" />
        </li>
      ))}
    </ul>
  );
}
