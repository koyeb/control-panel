import { TabButtons } from '@koyeb/design-system';

import { DocumentTitle } from 'src/components/document-title';
import { TabButtonLink } from 'src/components/link';
import { Title } from 'src/components/title';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.organizationSettings.layout');

export function OrganizationSettingsLayout({ children }: { children: React.ReactNode }) {
  const t = T.useTranslate();

  return (
    <div className="col gap-8">
      <DocumentTitle title={t('documentTitle')} />
      <Title title={<T id="title" />} />
      <Navigation />
      {children}
    </div>
  );
}

function Navigation() {
  return (
    <TabButtons className="self-start">
      <TabButtonLink to="/settings">
        <T id="navigation.general" />
      </TabButtonLink>
      <TabButtonLink to="/settings/billing">
        <T id="navigation.billing" />
      </TabButtonLink>
      <TabButtonLink to="/settings/plans">
        <T id="navigation.plans" />
      </TabButtonLink>
      <TabButtonLink to="/settings/api">
        <T id="navigation.api" />
      </TabButtonLink>
      <TabButtonLink to="/settings/registry-configuration">
        <T id="navigation.registrySecrets" />
      </TabButtonLink>
    </TabButtons>
  );
}
