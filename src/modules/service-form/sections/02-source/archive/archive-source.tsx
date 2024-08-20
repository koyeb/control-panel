import { DocumentationLink } from 'src/components/documentation-link';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('serviceForm.source.archive');

export function ArchiveSource() {
  return (
    <>
      <p>
        <T id="description" />
      </p>

      <DocumentationLink path="/docs/build-and-deploy/deploy-project-directory" className="self-start">
        <T id="documentationLink" />
      </DocumentationLink>
    </>
  );
}
