import { TabButtons } from '@koyeb/design-system';

import { DocumentTitle } from 'src/components/document-title';
import { TabButtonLink } from 'src/components/link';
import { Title } from 'src/components/title';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.userSettings.layout');

export function UserSettingsLayout({ children }: { children: React.ReactNode }) {
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
      <TabButtonLink to="/user/settings">
        <T id="navigation.general" />
      </TabButtonLink>
      <TabButtonLink to="/user/settings/organizations">
        <T id="navigation.organizations" />
      </TabButtonLink>
      <TabButtonLink to="/user/settings/api">
        <T id="navigation.apiCredential" />
      </TabButtonLink>
    </TabButtons>
  );
}
