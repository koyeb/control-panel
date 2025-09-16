import { Alert, Button } from '@koyeb/design-system';
import { Fragment, useMemo } from 'react';
import { FormattedList } from 'react-intl';

import { useInstances, useRegions } from 'src/api/hooks/catalog';
import { useOrganization, useOrganizationQuotas } from 'src/api/hooks/session';
import { CatalogInstance } from 'src/api/model';
import { formatBytes } from 'src/application/memory';
import { LinkButton } from 'src/components/link';
import { SectionHeader } from 'src/components/section-header';
import { TranslateEnum, createTranslate } from 'src/intl/translate';
import { isDefined } from 'src/utils/generic';
import { hasProperty } from 'src/utils/object';

const T = createTranslate('pages.organizationSettings.general.organizationQuotas');

type QuotaItem = {
  key: React.Key;
  label: React.ReactNode;
  value: React.ReactNode;
};

export function OrganizationQuotas() {
  const organization = useOrganization();

  const generalQuota = useGeneralQuotaItems();
  const instanceTypeQuota = useInstanceTypeQuotaItems();
  const volumesQuota = useVolumesQuotaItems();

  return (
    <section className="col items-start gap-6">
      <SectionHeader title={<T id="title" />} description={<T id="description" />} />

      {organization.plan === 'hobby' && <HobbyPlanAlert />}

      <div className="grid w-full grid-cols-2 rounded-md border md:grid-cols-[24rem_1fr]">
        <QuotasSection
          resourceLabel={<T id="resource" />}
          quotaLabel={<T id="quota" />}
          quotas={generalQuota}
        />

        <QuotasSection
          resourceLabel={<T id="koyebInstanceType" />}
          quotaLabel={<T id="quota" />}
          quotas={instanceTypeQuota.koyeb}
        />

        <QuotasSection
          resourceLabel={<T id="awsInstanceType" />}
          quotaLabel={<T id="quota" />}
          quotas={instanceTypeQuota.aws}
        />

        <QuotasSection
          resourceLabel={<T id="gpuInstanceType" />}
          quotaLabel={<T id="quota" />}
          quotas={instanceTypeQuota.gpu}
        />

        <QuotasSection
          resourceLabel={<T id="volumes" />}
          quotaLabel={<T id="quota" />}
          quotas={volumesQuota}
        />
      </div>

      {organization.plan !== 'hobby' && (
        <Button color="gray" className="intercom-contact-us self-end">
          <T id="requestIncrease" />
        </Button>
      )}
    </section>
  );
}

function HobbyPlanAlert() {
  return (
    <Alert variant="info" description={<T id="hobbyPlanAlert.description" />} className="w-full">
      <LinkButton color="blue" to="/settings/plans" className="ml-auto self-center">
        <T id="hobbyPlanAlert.cta" />
      </LinkButton>
    </Alert>
  );
}

type QuotasSectionProps = {
  resourceLabel: React.ReactNode;
  quotaLabel: React.ReactNode;
  quotas: QuotaItem[];
};

function QuotasSection({ resourceLabel, quotaLabel, quotas }: QuotasSectionProps) {
  return (
    <>
      <div className="border-b bg-muted/50 px-3 py-2 text-xs font-medium text-dim">{resourceLabel}</div>
      <div className="border-b bg-muted/50 px-3 py-2 text-xs font-medium text-dim">{quotaLabel}</div>

      {quotas.map((quota) => (
        <Fragment key={quota.key}>
          <div className="border-b px-3 py-2 last-of-type:border-none">{quota.label}</div>
          <div className="border-b px-3 py-2 last-of-type:border-none">{quota.value}</div>
        </Fragment>
      ))}
    </>
  );
}

function useGeneralQuotaItems(): QuotaItem[] {
  const organization = useOrganization();
  const quotas = useOrganizationQuotas();
  const allowedRegions = useAllowedRegions();

  return useMemo(() => {
    const web = <TranslateEnum key="web" enum="serviceType" value="web" />;
    const worker = <TranslateEnum key="worker" enum="serviceType" value="worker" />;
    const database = <TranslateEnum key="database" enum="serviceType" value="database" />;

    const allowedServiceTypes = organization.plan === 'hobby' ? [web, database] : [web, database, worker];

    return [
      {
        key: 'apps',
        label: <T id="apps" />,
        value: quotas.maxNumberOfApps,
      },
      {
        key: 'services',
        label: <T id="services" />,
        value: quotas.maxNumberOfServices,
      },
      {
        key: 'domains',
        label: <T id="domains" />,
        value: quotas.maxDomains,
      },
      {
        key: 'maxOrganizationMembers',
        label: <T id="maxOrganizationMembers" />,
        value: quotas.maxOrganizationMembers,
      },
      {
        key: 'serviceTypes',
        label: <T id="serviceTypes" />,
        value: <FormattedList value={allowedServiceTypes} style="narrow" />,
      },
      {
        key: 'regions',
        label: <T id="regions" />,
        value: <FormattedList value={allowedRegions.map((region) => region.name)} style="narrow" />,
      },
      {
        key: 'maximumMemory',
        label: <T id="maximumMemory" />,
        value: formatBytes(quotas.maxMemory),
      },
    ];
  }, [organization, quotas, allowedRegions]);
}

function useAllowedRegions() {
  const quotas = useOrganizationQuotas();
  const availableRegions = useRegions().filter(hasProperty('status', 'available'));

  if (quotas.regions === undefined) {
    return availableRegions;
  }

  return quotas.regions.map((region) => availableRegions.find(hasProperty('id', region))).filter(isDefined);
}

function useInstanceTypeQuotaItems(): Record<'koyeb' | 'aws' | 'gpu', QuotaItem[]> {
  const organization = useOrganization();
  const quotas = useOrganizationQuotas();
  const instances = useInstances();

  const unset = organization.plan === 'hobby' ? <T id="zero" /> : <T id="infinity" />;

  const getQuota = (instance: CatalogInstance): QuotaItem => ({
    key: instance.id,
    label: instance.displayName,
    value: quotas.maxInstancesByType[instance.id] ?? unset,
  });

  return {
    koyeb: instances
      .filter((instance) => instance.regionCategory === 'koyeb' && instance.category !== 'gpu')
      .map(getQuota),
    aws: instances.filter((instance) => instance.regionCategory === 'aws').map(getQuota),
    gpu: instances.filter((instance) => instance.category === 'gpu').map(getQuota),
  };
}

function useVolumesQuotaItems(): QuotaItem[] {
  const quotas = useOrganizationQuotas();
  const regions = useAllowedRegions();

  const quota = (regionId: string) => {
    return quotas.volumesByRegion[regionId] ?? quotas.volumesByRegion['*'];
  };

  return regions.map((region) => ({
    key: region.id,
    label: region.name,
    value: (
      <T
        id="volumeQuota"
        values={{
          maxVolumeSize: formatBytes(quota(region.id)?.maxVolumeSize ?? 0, { decimal: true }),
          maxTotalSize: formatBytes(quota(region.id)?.maxTotalSize ?? 0, { decimal: true }),
        }}
      />
    ),
  }));
}
