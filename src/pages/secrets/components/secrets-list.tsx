import {
  Button,
  ButtonMenuItem,
  Spinner,
  Table,
  TableColumnSelection,
  Tooltip,
  useBreakpoint,
} from '@koyeb/design-system';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useState } from 'react';

import { Secret } from 'src/api/model';
import { useApiQueryFn } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { ActionsMenu } from 'src/components/actions-menu';
import { Dialog } from 'src/components/dialog';
import { IconEye, IconEyeOff } from 'src/components/icons';
import { useClipboard } from 'src/hooks/clipboard';
import { FormattedDistanceToNow } from 'src/intl/formatted';
import { createTranslate, Translate } from 'src/intl/translate';

import { DeleteSecretDialog } from './delete-secret-dialog';
import { EditSecretDialog } from './edit-secret-dialog';
import { NoSecrets } from './no-secrets';

const T = createTranslate('pages.secrets.secretsList');

type SecretListProps = {
  secrets: Secret[];
  onCreate: () => void;
  selection: TableColumnSelection<Secret>;
};

export function SecretsList({ secrets, onCreate, selection }: SecretListProps) {
  const isMobile = !useBreakpoint('sm');

  if (secrets.length === 0) {
    return <NoSecrets onCreate={onCreate} />;
  }

  return (
    <Table
      selection={selection}
      items={secrets}
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
              className="text-start font-mono break-all whitespace-pre-line"
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
  const openDialog = Dialog.useOpen();

  return (
    <>
      <ActionsMenu>
        {(withClose) => (
          <>
            <ButtonMenuItem onClick={withClose(() => openDialog('EditSecret', { secretId: secret.id }))}>
              <T id="actions.edit" />
            </ButtonMenuItem>
            <ButtonMenuItem
              onClick={withClose(() => openDialog('ConfirmDeleteSecret', { resourceId: secret.id }))}
            >
              <T id="actions.delete" />
            </ButtonMenuItem>
          </>
        )}
      </ActionsMenu>

      <EditSecretDialog secret={secret} />
      <DeleteSecretDialog secret={secret} />
    </>
  );
}
