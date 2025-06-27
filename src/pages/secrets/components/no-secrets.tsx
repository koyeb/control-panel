import { Button } from '@koyeb/design-system';

import { NoResource } from 'src/components/no-resource';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.secrets.noSecrets');

export function NoSecrets({ onCreate }: { onCreate: () => void }) {
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
