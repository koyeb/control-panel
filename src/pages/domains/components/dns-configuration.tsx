import { Button, Table, useBreakpoint } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';
import { parse } from 'tldts';

import { Domain } from 'src/api/model';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { LinkButton } from 'src/components/link';
import { FormattedDistanceToNow } from 'src/intl/formatted';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.domains.domainsList.dnsConfiguration');

export function DnsConfiguration({ domain }: { domain: Domain }) {
  const t = T.useTranslate();

  const { domain: apex, subdomain } = useMemo(() => parse(domain.name), [domain.name]);

  const invalidate = useInvalidateApiQuery();

  const { mutate, isPending } = useMutation({
    ...useApiMutationFn('refreshDomain', {
      path: { id: domain.id },
    }),
    onSuccess() {
      void invalidate('listDomains');
      notify.info(t('refreshSuccess', { domainName: domain.name }));
    },
  });

  // should not happen
  if (apex === null || subdomain === null) {
    return null;
  }

  return (
    <>
      <div className="col gap-1">
        <strong>
          <T id="title" />
        </strong>

        {subdomain === '' && <ApexDomainConfiguration apex={apex} target={domain.intendedCname} />}

        {subdomain !== '' && (
          <SubDomainConfiguration apex={apex} subdomain={subdomain} target={domain.intendedCname} />
        )}
      </div>

      <DnsEntryTable domain={domain} />

      <div className="row gap-4">
        <LinkButton
          component="a"
          variant="outline"
          color="gray"
          href={getDocumentationLink(subdomain === '')}
          target="_blank"
          rel="noopener noreferrer"
        >
          <T id="docs" />
        </LinkButton>

        <Button color="gray" loading={isPending} onClick={() => mutate()} className="self-start">
          <T id="refresh" />
        </Button>
      </div>
    </>
  );
}

function getDocumentationLink(isApex: boolean) {
  const link = 'https://www.koyeb.com/docs/run-and-scale/domains';
  const anchor = isApex ? '#for-an-apex-domain' : '#for-a-subdomain';

  return `${link}${anchor}`;
}

type ApexDomainConfigurationProps = {
  apex: string;
  target: string;
};

function ApexDomainConfiguration({ apex, target }: ApexDomainConfigurationProps) {
  return (
    <p className="text-dim">
      <T id="apexDescription" values={{ apex, target }} />
    </p>
  );
}

type SubDomainConfigurationProps = {
  apex: string;
  subdomain: string;
  target: string;
};

function SubDomainConfiguration({ apex, subdomain, target }: SubDomainConfigurationProps) {
  return (
    <p className="text-dim">
      <T id="subdomainDescription" values={{ apex, subdomain, target }} />
    </p>
  );
}

function DnsEntryTable({ domain }: { domain: Domain }) {
  const isMobile = !useBreakpoint('sm');
  const { subdomain } = parse(domain.name);

  return (
    <Table
      items={[domain]}
      columns={{
        type: {
          header: <T id="type" />,
          render: () => <T id="cname" />,
        },
        name: {
          header: <T id="name" />,
          render: () => (subdomain === '' ? '@' : subdomain),
        },
        value: {
          header: <T id="value" />,
          render: () => domain.intendedCname,
        },
        lastVerified: {
          hidden: isMobile,
          header: <T id="lastVerified" />,
          render: () =>
            domain.verifiedAt ? <FormattedDistanceToNow value={domain.verifiedAt} /> : <T id="never" />,
        },
      }}
    />
  );
}
