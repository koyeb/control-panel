import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import { useEffect, useState } from 'react';

import { Combobox, Spinner } from '@koyeb/design-system';
import {
  useOrganization,
  useOrganizationUnsafe,
  useUserOrganizationMemberships,
} from 'src/api/hooks/session';
import { OrganizationMember } from 'src/api/model';
import { useApiMutationFn } from 'src/api/use-api';
import { routes } from 'src/application/routes';
import { useToken } from 'src/application/token';
import { SvgComponent } from 'src/application/types';
import { IconCheck, IconChevronsUpDown, IconCirclePlus } from 'src/components/icons';
import { Link } from 'src/components/link';
import { GeneratedAvatar, OrganizationAvatar } from 'src/components/organization-avatar';
import { TextSkeleton } from 'src/components/skeleton';
import { useNavigate } from 'src/hooks/router';
import { useSeon } from 'src/hooks/seon';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('layouts.organizationSwitcher');

export function OrganizationSwitcher(props: React.ComponentProps<typeof OrganizationSelectorCombobox>) {
  const currentOrganization = useOrganizationUnsafe();

  if (currentOrganization === undefined) {
    return <Skeleton />;
  }

  return <OrganizationSelectorCombobox {...props} />;
}

type OrganizationSelectorComboboxProps = {
  showCreateOrganization?: boolean;
  className?: string;
};

function OrganizationSelectorCombobox({
  showCreateOrganization,
  className,
}: OrganizationSelectorComboboxProps) {
  const t = T.useTranslate();
  const currentOrganization = useOrganization();
  const { data: organizationMembers = [] } = useUserOrganizationMemberships();
  const [filteredItems, setFilteredItems] = useState(organizationMembers);

  useEffect(() => {
    setFilteredItems(organizationMembers);
  }, [organizationMembers]);

  const switchOrganizationMutation = useSwitchOrganization(() => {
    combobox.closeMenu();
    // todo: add onClosed prop to combobox
    setTimeout(() => setFilteredItems(organizationMembers), 120);
  });

  const currentMembership = organizationMembers.find(
    (membership) => membership.organization.id === currentOrganization?.id,
  );

  const combobox = Combobox.useCombobox(
    {
      items: filteredItems,

      isItemDisabled: (item) => item === currentMembership,
      itemToString: (item) => item?.organization.name ?? '',

      onInputValueChange: ({ type, inputValue }) => {
        const filter = ({ organization }: OrganizationMember) => {
          return organization.name.toLowerCase().includes(inputValue.toLowerCase());
        };

        if (type === Combobox.stateChangeTypes.InputChange) {
          setFilteredItems(organizationMembers.filter(filter));
        }
      },

      selectedItem: null,
      onSelectedItemChange: ({ selectedItem }) => {
        if (selectedItem !== null) {
          switchOrganizationMutation.mutate(selectedItem.organization.id);
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

  const getItemIcon = ({ organization }: OrganizationMember) => {
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

      <Combobox.Dropdown>
        <input
          {...combobox.getInputProps()}
          type="search"
          placeholder={t('placeholder')}
          className={clsx('max-w-full border-b bg-transparent px-3 py-1.5', {
            hidden: organizationMembers.length <= 2,
          })}
        />

        <Combobox.Menu>
          {filteredItems.map((membership) => (
            <Combobox.MenuItem key={membership.id} item={membership} className="py-1.5">
              <OrganizationItem organization={membership.organization} Icon={getItemIcon(membership)} />
            </Combobox.MenuItem>
          ))}
        </Combobox.Menu>

        <div className={clsx('px-3 py-1.5 text-xs text-dim', { hidden: organizationMembers.length <= 2 })}>
          <T id="filtered" values={{ count: filteredItems.length, total: organizationMembers.length }} />
        </div>

        {showCreateOrganization && (
          <>
            <hr className="my-1" />

            <Link
              href={routes.userSettings.organizations()}
              state={{ create: true }}
              className="row mb-1 w-full gap-2 px-2 py-1.5"
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

function useSwitchOrganization(onSuccess?: () => void) {
  const { setToken } = useToken();
  const getSeonFingerprint = useSeon();
  const navigate = useNavigate();

  return useMutation({
    ...useApiMutationFn('switchOrganization', async (organizationId: string) => ({
      path: { id: organizationId },
      header: { 'seon-fp': await getSeonFingerprint() },
    })),
    async onSuccess(result) {
      setToken(result.token!.id!);
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

function Skeleton() {
  return (
    <button disabled type="button" className="row items-center gap-2 rounded-lg border px-3 py-1 text-start">
      <GeneratedAvatar seed="" className="size-6 rounded-full" />
      <TextSkeleton width={6} />
      <IconChevronsUpDown className="ml-auto size-4 text-dim" />
    </button>
  );
}
