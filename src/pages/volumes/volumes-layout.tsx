import { TabButtons } from '@koyeb/design-system';
import { useMatch } from '@tanstack/react-router';
import React from 'react';

import { useOrganization } from 'src/api';
import { DocumentationLink } from 'src/components/documentation-link';
import { FeatureUnavailable } from 'src/components/feature-unavailable';
import { LinkButton, TabButtonLink } from 'src/components/link';
import { IconArrowRight } from 'src/icons';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.volumes');

export function VolumesLayout({ children }: { children: React.ReactNode }) {
  const organization = useOrganization();
  const matchCreateVolume = useMatch({ from: '/_main/volumes/new', shouldThrow: false });

  if (organization?.plan === 'hobby') {
    return (
      <FeatureUnavailable
        preview="public"
        title={<T id="unavailable.title" />}
        subTitle={<T id="unavailable.subTitle" />}
        description={<T id="unavailable.description" />}
        cta={
          <LinkButton to="/settings/plans">
            <T id="unavailable.cta" />
            <IconArrowRight className="size-icon" />
          </LinkButton>
        }
        documentationLink={
          <DocumentationLink path="/docs/reference/volumes">
            <T id="unavailable.learnMore" />
          </DocumentationLink>
        }
      />
    );
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
