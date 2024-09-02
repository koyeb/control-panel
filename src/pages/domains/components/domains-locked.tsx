import { routes } from 'src/application/routes';
import { DocumentationLink } from 'src/components/documentation-link';
import { IconArrowRight } from 'src/components/icons';
import { LinkButton } from 'src/components/link';
import { Title } from 'src/components/title';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('pages.domains.domainsLocked');

export const DomainsLocked = () => {
  return (
    <div className="col items-start gap-4 rounded-md border p-6">
      <div className="col gap-2">
        <Title title={<T id="title" />} />

        <p className="font-medium">
          <T id="description" />
        </p>
      </div>

      <p>
        <T id="line1" values={{ br: () => <br /> }} />
      </p>

      <DocumentationLink path="/docs/run-and-scale/domains">
        <T id="docs" />
      </DocumentationLink>

      <LinkButton href={routes.organizationSettings.plans()}>
        <T id="upgrade" />
        <IconArrowRight className="size-icon" />
      </LinkButton>
    </div>
  );
};
