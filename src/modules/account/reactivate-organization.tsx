import { Button } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';

import { apiMutation, useInvalidateApiQuery, useOrganization } from 'src/api';
import { notify } from 'src/application/notify';
import { SectionHeader } from 'src/components/section-header';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('modules.account.reactivateOrganization');

export function ReactivateOrganization() {
  const organization = useOrganization();
  const invalidate = useInvalidateApiQuery();
  const t = T.useTranslate();

  const reactivate = useMutation({
    ...apiMutation('post /v1/organizations/{id}/reactivate', {
      path: { id: organization?.id as string },
    }),
    async onSuccess() {
      await invalidate('get /v1/account/organization');
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
