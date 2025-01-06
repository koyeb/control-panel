import { usePathname } from 'wouter/use-browser-location';

import { TabButtons } from '@koyeb/design-system';
import { routes } from 'src/application/routes';
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
      <Tab href={routes.userSettings.index()}>
        <T id="navigation.general" />
      </Tab>
      <Tab href={routes.userSettings.organizations()}>
        <T id="navigation.organizations" />
      </Tab>
      <Tab href={routes.userSettings.api()}>
        <T id="navigation.apiCredential" />
      </Tab>
    </TabButtons>
  );
}

function Tab(props: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();

  return <TabButtonLink selected={pathname === props.href} className="whitespace-nowrap" {...props} />;
}
