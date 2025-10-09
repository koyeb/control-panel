import { Button, Spinner, Table, TableColumnSelection, useBreakpoint } from '@koyeb/design-system';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useState } from 'react';

import { apiQuery } from 'src/api';
import { notify } from 'src/application/notify';
import { Tooltip } from 'src/components/tooltip';
import { useClipboard } from 'src/hooks/clipboard';
import { IconEye, IconEyeOff } from 'src/icons';
import { FormattedDistanceToNow } from 'src/intl/formatted';
import { Translate, createTranslate } from 'src/intl/translate';
import { Secret } from 'src/model';

import { NoSecrets } from './no-secrets';
import { SecretActions } from './secret-actions';

const T = createTranslate('pages.secrets.list');

type SecretListProps = {
  secrets: Secret[];
  onCreate: () => void;
  onDeleted: () => void;
  selection: TableColumnSelection<Secret>;
};

export function SecretsList({ secrets, onCreate, onDeleted, selection }: SecretListProps) {
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
          render: (secret) => <SecretActions secret={secret} onDeleted={onDeleted} />,
        },
      }}
    />
  );
}

const masked = '•••••••••••••••';

function Value({ secret }: { secret: Secret }) {
  const [showValue, setShowValue] = useState(false);

  const query = useQuery({
    ...apiQuery('post /v1/secrets/{id}/reveal', { path: { id: secret.id } }),
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
        <Tooltip
          trigger={(props) => (
            <button
              {...props}
              className="text-start font-mono break-all whitespace-pre-line"
              onClick={copyValue}
            >
              {query.data}
            </button>
          )}
          content={<Translate id="common.clickToCopy" />}
        />
      ) : (
        <div className="text-dim">{masked}</div>
      )}
    </div>
  );
}
