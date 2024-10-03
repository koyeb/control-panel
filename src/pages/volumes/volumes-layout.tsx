import React from 'react';

import { TabButtons, TabButton } from '@koyeb/design-system';
import { useOrganization } from 'src/api/hooks/session';
import { routes } from 'src/application/routes';
import { DocumentationLink } from 'src/components/documentation-link';
import { FeatureUnavailable } from 'src/components/feature-unavailable';
import { IconArrowRight } from 'src/components/icons';
import { LinkButton } from 'src/components/link';
import { useFeatureFlag } from 'src/hooks/feature-flag';
import { useNavigate, usePathname } from 'src/hooks/router';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('pages.volumes');

export function VolumesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const navigate = useNavigate();

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
          <TabButton
            selected={pathname === routes.volumes.index()}
            onClick={() => navigate(routes.volumes.index())}
          >
            Volumes
          </TabButton>
          <TabButton
            selected={pathname === routes.volumes.snapshots()}
            onClick={() => navigate(routes.volumes.snapshots())}
          >
            Snapshots
          </TabButton>
        </TabButtons>
      )}

      {children}
    </>
  );
}
