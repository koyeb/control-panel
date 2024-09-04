import { useState } from 'react';

import { Button } from '@koyeb/design-system';
import { useOrganization } from 'src/api/hooks/session';
import { useVolumesQuery } from 'src/api/hooks/volume';
import { routes } from 'src/application/routes';
import { DocumentTitle } from 'src/components/document-title';
import { DocumentationLink } from 'src/components/documentation-link';
import { FeatureUnavailable } from 'src/components/feature-unavailable';
import { IconArrowRight } from 'src/components/icons';
import { ExternalLinkButton, LinkButton } from 'src/components/link';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { Title } from 'src/components/title';
import { useFeatureFlag } from 'src/hooks/feature-flag';
import { Translate } from 'src/intl/translate';

import { CreateVolumeDialog } from './create-volume-dialog';
import { VolumesList } from './volumes-list';

const T = Translate.prefix('pages.volumes');

export function VolumesPage() {
  const organization = useOrganization();
  const volumesEnabled = useFeatureFlag('volumes');

  if (volumesEnabled === undefined) {
    return <Loading />;
  }

  const unavailableProps: React.ComponentProps<typeof FeatureUnavailable> = {
    preview: 'technical',
    title: <T id="unavailable.title" />,
    subTitle: <T id="unavailable.subTitle" />,
    description: <T id="unavailable.description" />,
    cta: (
      <ExternalLinkButton
        openInNewTab
        href="https://app.reclaim.ai/m/edouard/koyeb-volumes-technical-preview"
      >
        <T id="unavailable.cta" />
      </ExternalLinkButton>
    ),
    documentationLink: (
      <DocumentationLink path="/docs/reference/volumes">
        <T id="unavailable.learnMore" />
      </DocumentationLink>
    ),
  };

  if (!volumesEnabled) {
    return <FeatureUnavailable {...unavailableProps} />;
  }

  if (organization.plan === 'hobby') {
    return (
      <FeatureUnavailable
        {...unavailableProps}
        description={<T id="unavailable.descriptionHobby" />}
        cta={
          <LinkButton href={routes.organizationSettings.plans()}>
            <T id="unavailable.ctaHobby" />
            <IconArrowRight className="size-icon" />
          </LinkButton>
        }
      />
    );
  }

  return <Volumes />;
}

export function Volumes() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const t = T.useTranslate();

  const volumesQuery = useVolumesQuery();

  if (volumesQuery.isPending) {
    return <Loading />;
  }

  if (volumesQuery.isError) {
    return <QueryError error={volumesQuery.error} />;
  }

  const volumes = volumesQuery.data;

  return (
    <div className="col gap-6">
      <DocumentTitle title={t('documentTitle')} />

      <Title
        title={<T id="header.title" />}
        end={
          volumes.length > 0 && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <T id="header.createVolume" />
            </Button>
          )
        }
      />

      <VolumesList volumes={volumes} onCreate={() => setCreateDialogOpen(true)} />
      <CreateVolumeDialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} />
    </div>
  );
}
