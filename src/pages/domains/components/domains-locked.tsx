import { DocumentationLink } from 'src/components/documentation-link';
import { FeatureUnavailable } from 'src/components/feature-unavailable';
import { LinkButton } from 'src/components/link';
import { Title } from 'src/components/title';
import { IconArrowRight } from 'src/icons';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.domains.locked');

export function DomainsLocked() {
  return (
    <FeatureUnavailable>
      <Title title={<T id="title" />} />

      <p className="mt-2 mb-4 font-medium">
        <T id="subTitle" />
      </p>

      <p className="max-w-xl">
        <T id="description" values={{ br: () => <br /> }} />
      </p>

      <div className="mt-6 row items-center gap-4">
        <LinkButton to="/settings/plans">
          <T id="upgrade" />
          <IconArrowRight className="size-icon" />
        </LinkButton>

        <DocumentationLink path="/docs/run-and-scale/domains">
          <T id="docs" />
        </DocumentationLink>
      </div>
    </FeatureUnavailable>
  );
}
