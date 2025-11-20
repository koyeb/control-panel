import { TabButtons } from '@koyeb/design-system';
import { useMatch } from '@tanstack/react-router';
import React from 'react';

import { useOrganization } from 'src/api';
import { BadgeNew } from 'src/components/badge-new';
import { DocumentationLink } from 'src/components/documentation-link';
import { FeatureUnavailable } from 'src/components/feature-unavailable';
import { LinkButton, TabButtonLink } from 'src/components/link';
import { Title } from 'src/components/title';
import { IconArrowRight } from 'src/icons';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.volumes');

export function VolumesLayout({ children }: { children: React.ReactNode }) {
  const organization = useOrganization();
  const matchCreateVolume = useMatch({ from: '/_main/volumes/new', shouldThrow: false });

  if (organization?.plan === 'hobby') {
    return <VolumesUnavailable />;
  }

  return (
    <div className="col gap-8">
      {!matchCreateVolume && (
        <TabButtons>
          <TabButtonLink from="/volumes" to=".">
            <T id="tabs.volumes" />
          </TabButtonLink>
          <TabButtonLink from="/volumes" to="./snapshots">
            <T id="tabs.snapshots" />
          </TabButtonLink>
        </TabButtons>
      )}

      {children}
    </div>
  );
}

function VolumesUnavailable() {
  return (
    <FeatureUnavailable>
      <BadgeNew className="mb-2">
        <T id="unavailable.publicPreview" />
      </BadgeNew>

      <Title title={<T id="unavailable.title" />} />

      <p className="mt-2 mb-4 font-medium">
        <T id="unavailable.subTitle" />
      </p>

      <p className="max-w-xl">
        <T id="unavailable.description" />
      </p>

      <div className="mt-6 row items-center gap-4">
        <LinkButton to="/settings/plans">
          <T id="unavailable.cta" />
          <IconArrowRight className="size-icon" />
        </LinkButton>

        <DocumentationLink path="/docs/reference/volumes">
          <T id="unavailable.learnMore" />
        </DocumentationLink>
      </div>
    </FeatureUnavailable>
  );
}
