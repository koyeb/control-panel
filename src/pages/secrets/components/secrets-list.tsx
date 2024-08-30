import { keepPreviousData, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import IconEyeOff from 'lucide-static/icons/eye-off.svg?react';
import IconEye from 'lucide-static/icons/eye.svg?react';
import { useState } from 'react';

import { Button, ButtonMenuItem, Spinner, Table, Tooltip, useBreakpoint } from '@koyeb/design-system';
import { useSecretsQuery } from 'src/api/hooks/secret';
import { Secret } from 'src/api/model';
import { useApiQueryFn } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { ActionsMenu } from 'src/components/actions-menu';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { useClipboard } from 'src/hooks/clipboard';
import { FormattedDistanceToNow } from 'src/intl/formatted';
import { Translate } from 'src/intl/translate';

import { DeleteSecretDialog } from './delete-secret-dialog';
import { EditSecretDialog } from './edit-secret-dialog';
import { NoSecrets } from './no-secrets';

const T = Translate.prefix('pages.secrets.secretsList');

export function SecretsList({ onCreate }: { onCreate: () => void }) {
  const isMobile = !useBreakpoint('sm');
  const secretsQuery = useSecretsQuery('simple');

  if (secretsQuery.isPending) {
    return <Loading />;
  }

  if (secretsQuery.isError) {
    return <QueryError error={secretsQuery.error} />;
  }

  const secrets = secretsQuery.data;

  if (secrets.length === 0) {
    return <NoSecrets onCreate={onCreate} />;
  }

  return (
    <Table
      items={secrets}
      classes={{ td: () => 'align-top' }}
      columns={{
        name: {
          className: 'md:w-64',
          header: <T id="name" />,
          render: (secret) => secret.name,
        },
        value: {
          header: <T id="value" />,
          render: (secret) => <Value secret={secret} />,
        },
        updated: {
          hidden: isMobile,
          className: clsx('lg:w-48'),
          header: <T id="updated" />,
          render: (secret) => <FormattedDistanceToNow value={secret.updatedAt} />,
        },
        actions: {
          className: clsx('w-12'),
          render: (secret) => <SecretActions secret={secret} />,
        },
      }}
    />
  );
}

const masked = '•••••••••••••••';

function Value({ secret }: { secret: Secret }) {
  const [showValue, setShowValue] = useState(false);

  const query = useQuery({
    ...useApiQueryFn('revealSecret', { path: { id: secret.id } }),
    enabled: showValue,
    refetchInterval: false,
    placeholderData: keepPreviousData,
    select: (result) => result.value as unknown as string,
  });

  const icon = () => {
    if (query.isLoading) {
      return <Spinner className="size-4" />;
    }

    if (showValue) {
      return <IconEyeOff className="size-4" />;
    }

    return <IconEye className="size-4" />;
  };

  const copy = useClipboard();
  const t = T.useTranslate();

  const copyValue = () => {
    copy(query.data ?? '', () => notify.info(t('copySuccess')));
  };

  return (
    <div className="row items-start gap-2">
      <Button color="gray" size={1} className="px-1 py-0" onClick={() => setShowValue(!showValue)}>
        {icon()}
      </Button>

      {showValue && query.data !== undefined ? (
        <Tooltip content={<Translate id="common.clickToCopy" />}>
          {(props) => (
            <button
              {...props}
              className="whitespace-pre-line break-all text-start font-mono"
              onClick={copyValue}
            >
              {query.data}
            </button>
          )}
        </Tooltip>
      ) : (
        <div className="text-dim">{masked}</div>
      )}
    </div>
  );
}

function SecretActions({ secret }: { secret: Secret }) {
  const [openDialog, setOpenDialog] = useState<'edit' | 'delete'>();
  const onClose = () => setOpenDialog(undefined);

  return (
    <>
      <ActionsMenu>
        {(withClose) => (
          <>
            <ButtonMenuItem onClick={withClose(() => setOpenDialog('edit'))}>
              <T id="actions.edit" />
            </ButtonMenuItem>
            <ButtonMenuItem onClick={withClose(() => setOpenDialog('delete'))}>
              <T id="actions.delete" />
            </ButtonMenuItem>
          </>
        )}
      </ActionsMenu>

      <EditSecretDialog open={openDialog === 'edit'} onClose={onClose} secret={secret} />
      <DeleteSecretDialog open={openDialog === 'delete'} onClose={onClose} secret={secret} />
    </>
  );
}
