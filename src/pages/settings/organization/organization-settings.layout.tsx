import { TabButtons } from '@koyeb/design-system';
import { usePathname } from 'wouter/use-browser-location';

import { routes } from 'src/application/routes';
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
      <Tab href={routes.organizationSettings.index()}>
        <T id="navigation.general" />
      </Tab>
      <Tab href={routes.organizationSettings.billing()}>
        <T id="navigation.billing" />
      </Tab>
      <Tab href={routes.organizationSettings.plans()}>
        <T id="navigation.plans" />
      </Tab>
      <Tab href={routes.organizationSettings.api()}>
        <T id="navigation.api" />
      </Tab>
      <Tab href={routes.organizationSettings.registrySecrets()}>
        <T id="navigation.registrySecrets" />
      </Tab>
    </TabButtons>
  );
}

function Tab(props: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();

  return <TabButtonLink selected={pathname === props.href} className="whitespace-nowrap" {...props} />;
}
