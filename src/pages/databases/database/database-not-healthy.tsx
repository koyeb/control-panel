import * as intercom from '@intercom/messenger-js-sdk';
import { useMutation } from '@tanstack/react-query';

import { Button } from '@koyeb/design-system';
import { Service } from 'src/api/model';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { routes } from 'src/application/routes';
import { useNavigate } from 'src/hooks/router';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('pages.database.layout.databaseNotHealthy');

export function DatabaseNotHealth({ service }: { service: Service }) {
  const invalidate = useInvalidateApiQuery();
  const navigate = useNavigate();
  const t = T.useTranslate();

  const mutation = useMutation({
    ...useApiMutationFn('deleteService', {
      path: { id: service.id },
    }),
    async onSuccess() {
      await invalidate('getService', { path: { id: service.id } });
      navigate(routes.home());
      notify.info(t('deleteSuccessNotification'));
    },
  });

  return (
    <div className="col my-6 justify-center gap-2">
      <p className="text-lg font-medium">
        <T id="title" />
      </p>

      <p className="text-dim">
        <T id="description" />
      </p>

      <div className="row mt-4 gap-4">
        <Button onClick={() => intercom.showNewMessage(prefillMessage(service.id))}>
          <T id="contactUs" />
        </Button>

        <Button
          variant="outline"
          color="orange"
          loading={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          <T id="delete" />
        </Button>
      </div>
    </div>
  );
}

function prefillMessage(serviceId: string) {
  return `Hi!\nMy database is not healthy and I don't understand why. The id of the database service is: ${serviceId}.\nCan you help me, please?\nThank you.`;
}
