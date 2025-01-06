import { routes } from 'src/application/routes';
import { DocumentationLink } from 'src/components/documentation-link';
import { FeatureUnavailable } from 'src/components/feature-unavailable';
import { IconArrowRight } from 'src/components/icons';
import { LinkButton } from 'src/components/link';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.domains.domainsLocked');

export function DomainsLocked() {
  return (
    <FeatureUnavailable
      title={<T id="title" />}
      subTitle={<T id="subTitle" />}
      description={<T id="description" values={{ br: () => <br /> }} />}
      cta={
        <LinkButton href={routes.organizationSettings.plans()}>
          <T id="upgrade" />
          <IconArrowRight className="size-icon" />
        </LinkButton>
      }
      documentationLink={
        <DocumentationLink path="/docs/run-and-scale/domains">
          <T id="docs" />
        </DocumentationLink>
      }
    />
  );
}
