import { TabButtons } from '@koyeb/design-system';
import React from 'react';

import { useOrganization } from 'src/api/hooks/session';
import { DocumentationLink } from 'src/components/documentation-link';
import { FeatureUnavailable } from 'src/components/feature-unavailable';
import { LinkButton, TabButtonLink } from 'src/components/link';
import { IconArrowRight } from 'src/icons';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.volumes');

export function VolumesLayout({ children }: { children: React.ReactNode }) {
  const organization = useOrganization();

  if (organization.plan === 'hobby') {
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
    <>
      <TabButtons className="mb-6">
        <TabButtonLink to="/volumes">Volumes</TabButtonLink>
        <TabButtonLink to="/volumes/snapshots">Snapshots</TabButtonLink>
      </TabButtons>

      {children}
    </>
  );
}
