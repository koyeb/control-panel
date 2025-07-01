import { Combobox, Spinner } from '@koyeb/design-system';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useState } from 'react';

import { useOrganization, useUser } from 'src/api/hooks/session';
import { mapOrganization } from 'src/api/mappers/session';
import { Organization } from 'src/api/model';
import { useApiMutationFn, useApiQueryFn } from 'src/api/use-api';
import { useAuth } from 'src/application/authentication';
import { routes } from 'src/application/routes';
import { SvgComponent } from 'src/application/types';
import { IconCheck, IconChevronsUpDown, IconCirclePlus } from 'src/components/icons';
import { Link } from 'src/components/link';
import { OrganizationAvatar } from 'src/components/organization-avatar';
import { useNavigate } from 'src/hooks/router';
import { useSeon } from 'src/hooks/seon';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('layouts.organizationSwitcher');

type OrganizationSwitcherProps = {
  showCreateOrganization?: boolean;
  className?: string;
};

export function OrganizationSwitcher({ showCreateOrganization, className }: OrganizationSwitcherProps) {
  const t = T.useTranslate();
  const currentOrganization = useOrganization();

  const [inputValue, setInputValue] = useState('');
  const organizations = useOrganizationList(inputValue);
  const count = useOrganizationCount();

  const switchOrganizationMutation = useSwitchOrganization(() => {
    combobox.closeMenu();
  });

  const combobox = Combobox.useCombobox(
    {
      items: organizations,

      isItemDisabled: (item) => item.id === currentOrganization.id,
      itemToString: (item) => item?.name ?? '',

      inputValue,
      onInputValueChange: ({ inputValue }) => {
        setInputValue(inputValue);
      },

      selectedItem: null,
      onSelectedItemChange: ({ selectedItem }) => {
        if (selectedItem !== null) {
          switchOrganizationMutation.mutate(selectedItem.id);
        }
      },

      stateReducer: (state, { type, changes }) => {
        switch (type) {
          case Combobox.stateChangeTypes.InputClick:
            return { ...changes, isOpen: state.isOpen };

          case Combobox.stateChangeTypes.ItemClick:
          case Combobox.stateChangeTypes.InputKeyDownEnter:
            return { ...changes, inputValue: state.inputValue, isOpen: state.isOpen };

          default:
            return changes;
        }
      },
    },
    {
      strategy: 'fixed',
    },
  );

  const getItemIcon = (organization: Organization) => {
    if (organization.id === currentOrganization.id) {
      return IconCheck;
    }

    if (switchOrganizationMutation.isPending && switchOrganizationMutation.variables === organization.id) {
      return Spinner;
    }
  };

  return (
    <Combobox.Provider value={combobox}>
      <button
        {...combobox.getToggleButtonProps({ type: 'button' })}
        ref={combobox.floating.refs.setReference}
        className={clsx('rounded border px-2 py-1 text-start', className)}
      >
        <OrganizationItem organization={currentOrganization} Icon={IconChevronsUpDown} />
      </button>

      <Combobox.Dropdown onTransitionCancel={() => setInputValue('')}>
        <input
          {...combobox.getInputProps()}
          type="search"
          placeholder={t('placeholder')}
          className={clsx('max-w-full border-b bg-transparent px-3 py-1.5', { hidden: count <= 10 })}
        />

        <Combobox.Menu>
          {organizations.map((organization) => (
            <Combobox.MenuItem key={organization.id} item={organization} className="py-1.5">
              <OrganizationItem organization={organization} Icon={getItemIcon(organization)} />
            </Combobox.MenuItem>
          ))}
        </Combobox.Menu>

        <div className={clsx('px-3 py-1.5 text-xs text-dim', { hidden: count <= 10 })}>
          <T id="filtered" values={{ count: organizations.length, total: count }} />
        </div>

        {showCreateOrganization && (
          <>
            <hr className="my-1" />

            <Link
              href={routes.userSettings.organizations()}
              state={{ create: true }}
              className="mb-1 row w-full gap-2 px-2 py-1.5"
            >
              <IconCirclePlus className="size-5" />
              <T id="createOrganization" />
            </Link>
          </>
        )}
      </Combobox.Dropdown>
    </Combobox.Provider>
  );
}

function useOrganizationCount() {
  const user = useUser();

  const { data } = useQuery({
    ...useApiQueryFn('listOrganizationMembers', { query: { user_id: user.id } }),
    refetchInterval: false,
    placeholderData: keepPreviousData,
    select: ({ count }) => count,
  });

  return data ?? 0;
}

function useOrganizationList(search: string) {
  const { data } = useQuery({
    ...useApiQueryFn('listUserOrganizations', {
      query: { search, limit: '10' },
    }),
    refetchInterval: false,
    placeholderData: keepPreviousData,
    select: ({ organizations }) => organizations!.map(mapOrganization),
  });

  return data ?? [];
}

function useSwitchOrganization(onSuccess?: () => void) {
  const { setToken } = useAuth();
  const getSeonFingerprint = useSeon();
  const navigate = useNavigate();

  return useMutation({
    ...useApiMutationFn('switchOrganization', async (organizationId: string) => ({
      path: { id: organizationId },
      header: { 'seon-fp': await getSeonFingerprint() },
    })),
    async onSuccess(result) {
      setToken(result.token!.id!, false);
      navigate(routes.home());
      onSuccess?.();
    },
  });
}

type OrganizationItemProps = {
  organization: { id: string; name: string };
  Icon?: SvgComponent;
};

function OrganizationItem({ organization, Icon }: OrganizationItemProps) {
  return (
    <div className="row w-full items-center gap-2">
      <OrganizationAvatar organizationName={organization.name} className="size-6 rounded-full" />

      <span className="flex-1 truncate font-medium">{organization.name}</span>

      {Icon && (
        <span>
          <Icon className="size-4" />
        </span>
      )}
    </div>
  );
}
