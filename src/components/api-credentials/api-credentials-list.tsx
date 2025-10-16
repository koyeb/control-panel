import { Button, ButtonMenuItem, Table } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';

import { apiMutation, useInvalidateApiQuery } from 'src/api';
import { notify } from 'src/application/notify';
import { NoResource } from 'src/components/no-resource';
import { FormattedDistanceToNow } from 'src/intl/formatted';
import { createTranslate } from 'src/intl/translate';
import { ApiCredential, ApiCredentialType } from 'src/model';

import { ActionsMenu } from '../actions-menu';
import { closeDialog, openDialog } from '../dialog';

type ApiCredentialListProps = {
  type: ApiCredentialType;
  credentials: ApiCredential[];
  onCreate: () => void;
};

export function ApiCredentialsList({ type, credentials, onCreate }: ApiCredentialListProps) {
  const T = createTranslate(`pages.${type}Settings.apiCredential.list`);

  if (credentials.length === 0) {
    return (
      <NoResource
        title={<T id="noApiCredentials.title" />}
        description={<T id="noApiCredentials.description" />}
        cta={
          <Button onClick={onCreate}>
            <T id="noApiCredentials.cta" />
          </Button>
        }
      />
    );
  }

  return (
    <Table
      items={credentials}
      columns={{
        name: {
          header: <T id="name" />,
          render: (credential) => credential.name,
        },
        description: {
          header: <T id="description" />,
          render: (credential) => credential.description,
        },
        created: {
          className: 'lg:w-48',
          header: <T id="created" />,
          render: (credential) => <FormattedDistanceToNow value={credential.createdAt} />,
        },
        actions: {
          className: 'w-12',
          render: (credential) => <CredentialActions type={type} credential={credential} />,
        },
      }}
    />
  );
}

function CredentialActions({ type, credential }: { type: ApiCredentialType; credential: ApiCredential }) {
  const T = createTranslate(`pages.${type}Settings.apiCredential`);
  const t = T.useTranslate();
  const invalidate = useInvalidateApiQuery();

  const mutation = useMutation({
    ...apiMutation('delete /v1/credentials/{id}', (credential: ApiCredential) => ({
      path: { id: credential.id },
    })),
    async onSuccess(_, { name }) {
      await invalidate('get /v1/credentials');
      notify.info(t('delete.successNotification', { name }));
      closeDialog();
    },
  });

  const onDelete = () => {
    openDialog('Confirmation', {
      title: t('delete.title'),
      description: t('delete.description', {
        name: credential.name,
        strong: (children) => <strong className="text-default">{children}</strong>,
      }),
      destructiveAction: true,
      confirmationText: credential.name,
      submitText: t('delete.confirm'),
      onConfirm: () => mutation.mutateAsync(credential),
    });
  };

  return (
    <ActionsMenu>
      {(withClose) => (
        <ButtonMenuItem onClick={withClose(onDelete)}>
          <T id="list.actions.delete" />
        </ButtonMenuItem>
      )}
    </ActionsMenu>
  );
}
