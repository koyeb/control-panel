import { BadgeNew } from 'src/components/badge-new';
import { DocumentationLink } from 'src/components/documentation-link';
import { ExternalLinkButton } from 'src/components/link';
import { Title } from 'src/components/title';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('pages.volumes.requestAccess');

export const VolumesRequestAccess = () => {
  return (
    <>
      <BadgeNew className="mb-1">
        <T id="preview" />
      </BadgeNew>

      <Title title={<T id="title" />} />

      <p className="mb-4 mt-2 font-medium">
        <T id="subTitle" />
      </p>

      <p className="max-w-xl">
        <T id="description" />
      </p>

      <div className="row mt-6 items-center gap-4">
        <ExternalLinkButton
          openInNewTab
          href="https://app.reclaim.ai/m/edouard/koyeb-volumes-technical-preview"
        >
          <T id="cta" />
        </ExternalLinkButton>

        <DocumentationLink path="/docs/reference/volumes">
          <T id="learnMore" />
        </DocumentationLink>
      </div>
    </>
  );
};
