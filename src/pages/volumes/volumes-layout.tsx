import React from 'react';

import { TabButtons } from '@koyeb/design-system';
import { useOrganization } from 'src/api/hooks/session';
import { routes } from 'src/application/routes';
import { DocumentationLink } from 'src/components/documentation-link';
import { FeatureUnavailable } from 'src/components/feature-unavailable';
import { IconArrowRight } from 'src/components/icons';
import { LinkButton, TabButtonLink } from 'src/components/link';
import { useFeatureFlag } from 'src/hooks/feature-flag';
import { usePathname } from 'src/hooks/router';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('pages.volumes');

export function VolumesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const organization = useOrganization();
  const snapshots = useFeatureFlag('snapshots');

  if (organization.plan === 'hobby') {
    return (
      <FeatureUnavailable
        preview="public"
        title={<T id="unavailable.title" />}
        subTitle={<T id="unavailable.subTitle" />}
        description={<T id="unavailable.description" />}
        cta={
          <LinkButton href={routes.organizationSettings.plans()}>
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
      {snapshots && (
        <TabButtons className="mb-6">
          <TabButtonLink href={routes.volumes.index()} selected={pathname === routes.volumes.index()}>
            Volumes
          </TabButtonLink>
          <TabButtonLink href={routes.volumes.snapshots()} selected={pathname === routes.volumes.snapshots()}>
            Snapshots
          </TabButtonLink>
        </TabButtons>
      )}

      {children}
    </>
  );
}
