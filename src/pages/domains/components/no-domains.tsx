import { Button } from '@koyeb/design-system';
import { NoResource } from 'src/components/no-resource';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.domains.domainsList.noDomains');

export function NoDomains({ onCreate }: { onCreate: () => void }) {
  return (
    <NoResource
      title={<T id="title" />}
      description={<T id="description" />}
      cta={
        <Button onClick={onCreate}>
          <T id="cta" />
        </Button>
      }
    />
  );
}
