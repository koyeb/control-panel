import { Dropdown, Menu, MenuItem, Spinner, useDropdown } from '@koyeb/design-system';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useCombobox } from 'downshift';
import { useState } from 'react';
import { createPortal } from 'react-dom';

import { apiQuery, useOrganization, useOrganizationsList, useSwitchOrganization, useUser } from 'src/api';
import { SvgComponent } from 'src/application/types';
import { LinkMenuItem } from 'src/components/dropdown-menu';
import { OrganizationAvatar } from 'src/components/organization-avatar';
import { IconCheck, IconChevronsUpDown, IconCirclePlus } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { Organization } from 'src/model';

const T = createTranslate('layouts.organizationSwitcher');

const limit = 10;

type OrganizationSwitcherProps = {
  showCreateOrganization?: boolean;
  dark?: boolean;
  className?: string;
};

export function OrganizationSwitcher({ showCreateOrganization, dark, className }: OrganizationSwitcherProps) {
  const t = T.useTranslate();
  const currentOrganization = useOrganization();

  const [inputValue, setInputValue] = useState('');
  const organizations = useOrganizationsList({ search: inputValue, limit });
  const count = useOrganizationCount();

  const switchOrganizationMutation = useSwitchOrganization({
    onSuccess: () => combobox.closeMenu(),
  });

  const combobox = useCombobox({
    items: organizations,

    itemToString: (organization) => organization?.name ?? '',
    isItemDisabled: (item) => item.id === currentOrganization?.id,

    inputValue,
    onInputValueChange({ inputValue }) {
      setInputValue(inputValue);
    },

    selectedItem: null,
    onSelectedItemChange({ selectedItem: organization }) {
      if (organization) {
        switchOrganizationMutation.mutate(organization.externalId);
      }
    },

    stateReducer: (state, { type, changes }) => {
      switch (type) {
        case useCombobox.stateChangeTypes.InputClick:
          return { ...changes, isOpen: state.isOpen };

        case useCombobox.stateChangeTypes.ItemClick:
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
          return { ...changes, inputValue: state.inputValue, isOpen: state.isOpen };

        default:
          return changes;
      }
    },
  });

  const dropdown = useDropdown({
    floating: { open: combobox.isOpen, strategy: 'fixed' },
    matchReferenceSize: true,
    flip: true,
    offset: 8,
  });

  const getItemIcon = (organization: Organization) => {
    if (organization.id === currentOrganization?.id) {
      return IconCheck;
    }

    if (
      switchOrganizationMutation.isPending &&
      switchOrganizationMutation.variables === organization.externalId
    ) {
      return Spinner;
    }
  };

  if (!currentOrganization) {
    return;
  }

  return (
    <>
      <button
        {...combobox.getToggleButtonProps({ ref: dropdown.refs.setReference, type: 'button' })}
        className={clsx('rounded-sm border px-2 py-1 text-start', className)}
      >
        <OrganizationItem organization={currentOrganization} Icon={IconChevronsUpDown} />
      </button>

      {createPortal(
        <Dropdown dropdown={dropdown} onClosed={() => setInputValue('')} className={clsx({ dark })}>
          <input
            {...combobox.getInputProps()}
            type="search"
            placeholder={t('placeholder')}
            className={clsx('max-w-full border-b bg-transparent px-3 py-1.5 outline-none', {
              hidden: count <= limit,
            })}
          />

          <Menu {...combobox.getMenuProps()} className="max-h-64 overflow-auto">
            {organizations.map((organization, index) => (
              <MenuItem
                key={organization.id}
                highlighted={index === combobox.highlightedIndex}
                {...combobox.getItemProps({ item: organization, index })}
              >
                <OrganizationItem organization={organization} Icon={getItemIcon(organization)} />
              </MenuItem>
            ))}
          </Menu>

          <div className={clsx('px-3 py-1.5 text-xs text-dim', { hidden: count <= limit })}>
            <T id="filtered" values={{ count: organizations.length, total: count }} />
          </div>

          {showCreateOrganization && (
            <>
              <hr className="" />

              <Menu>
                <LinkMenuItem to="/user/settings/organizations" state={{ create: true }} className="py-0.5!">
                  <IconCirclePlus className="size-5" />
                  <T id="createOrganization" />
                </LinkMenuItem>
              </Menu>
            </>
          )}
        </Dropdown>,
        document.getElementById('root') ?? document.body,
      )}
    </>
  );
}

function useOrganizationCount() {
  const user = useUser();

  const { data } = useQuery({
    ...apiQuery('get /v1/organization_members', { query: { user_id: user?.id } }),
    enabled: user !== undefined,
    placeholderData: keepPreviousData,
    select: ({ count }) => count,
  });

  return data ?? 0;
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
