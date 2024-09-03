import { useMutation } from '@tanstack/react-query';

import { Button } from '@koyeb/design-system';
import { useOrganization } from 'src/api/hooks/session';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { SectionHeader } from 'src/components/section-header';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('account.reactivateOrganization');

export function ReactivateOrganization() {
  const organization = useOrganization();
  const invalidate = useInvalidateApiQuery();
  const t = T.useTranslate();

  const reactivate = useMutation({
    ...useApiMutationFn('reactivateOrganization', {
      path: { id: organization.id },
    }),
    async onSuccess() {
      await invalidate('getCurrentOrganization');
      notify.info(t('successNotification'));
    },
  });

  return (
    <section className="card row items-center gap-4 p-3">
      <SectionHeader title={<T id="title" />} description={<T id="description" />} className="flex-1" />

      <Button color="blue" loading={reactivate.isPending} onClick={() => reactivate.mutate()}>
        <T id="reactivate" />
      </Button>
    </section>
  );
}
