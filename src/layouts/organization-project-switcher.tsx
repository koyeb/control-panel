import { useDismiss, useInteractions } from '@floating-ui/react';
import {
  Dropdown,
  Input,
  InputStart,
  Menu,
  MenuItem,
  Spinner,
  TabButton,
  TabButtons,
  useDropdown,
} from '@koyeb/design-system';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import clsx from 'clsx';
import { UseComboboxReturnValue, useCombobox } from 'downshift';
import { useState } from 'react';
import { createPortal } from 'react-dom';

import { apiQuery, useOrganization, useOrganizationsList, useSwitchOrganization, useUser } from 'src/api';
import { useCurrentProject, useCurrentProjectId, useProjects } from 'src/api/hooks/project';
import { openDialog } from 'src/components/dialog';
import { OrganizationAvatar } from 'src/components/organization-avatar';
import { IconCheck, IconChevronDown, IconPlus, IconSearch } from 'src/icons';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('layouts.organizationProjectSwitcher');

const limit = 10;

type OrganizationSwitcherProps = {
  showCreateOrganization?: boolean;
  dark?: boolean;
  className?: string;
};

export function OrganizationProjectSwitcher({
  showCreateOrganization,
  dark,
  className,
}: OrganizationSwitcherProps) {
  const currentOrganization = useOrganization();
  const currentProject = useCurrentProject();

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'project' | 'organization'>('project');

  const dropdown = useDropdown({
    floating: {
      open,
      onOpenChange: setOpen,
      strategy: 'fixed',
      placement: 'bottom-start',
    },
    flip: true,
    offset: 8,
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useDismiss(dropdown.context, { outsidePress: true, escapeKey: true }),
  ]);

  if (!currentOrganization || !currentProject) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className={clsx('rounded-sm border px-2 py-1 text-start', className)}
        {...getReferenceProps({ ref: dropdown.refs.setReference, onClick: () => setOpen(true) })}
      >
        <div className="row w-full items-center gap-2">
          <OrganizationAvatar organizationName={currentOrganization.name} className="size-6 rounded-full" />

          <div className="col grow gap-0.5">
            <span className="truncate font-medium">{currentOrganization.name}</span>
            <div className="text-xs font-medium text-dim">{currentProject.name}</div>
          </div>

          <span>
            <IconChevronDown className="size-4" />
          </span>
        </div>
      </button>

      {createPortal(
        <Dropdown dropdown={dropdown} className={clsx('w-64 rounded-md', { dark })} {...getFloatingProps()}>
          <div className="p-3">
            <TabButtons className="w-full">
              <TabButton selected={tab === 'project'} onClick={() => setTab('project')}>
                <T id="tabs.project" />
              </TabButton>
              <TabButton selected={tab === 'organization'} onClick={() => setTab('organization')}>
                <T id="tabs.organization" />
              </TabButton>
            </TabButtons>
          </div>

          {tab === 'organization' ? (
            <OrganizationSelector showCreate={showCreateOrganization} closeMenu={() => setOpen(false)} />
          ) : (
            <ProjectSelector closeMenu={() => setOpen(false)} />
          )}
        </Dropdown>,
        document.getElementById('root') ?? document.body,
      )}
    </>
  );
}

function OrganizationSelector({ showCreate, closeMenu }: { showCreate?: boolean; closeMenu: () => void }) {
  const t = T.useTranslate();

  const [inputValue, setInputValue] = useState('');

  const organizations = useOrganizationsList({ search: inputValue, limit });
  const currentOrganization = useOrganization();
  const count = useOrganizationCount();

  const switchOrganizationMutation = useSwitchOrganization({
    onSuccess: closeMenu,
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
        case useCombobox.stateChangeTypes.ItemClick:
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
          return { ...changes, inputValue: state.inputValue };

        default:
          return changes;
      }
    },
  });

  if (!currentOrganization) {
    return null;
  }

  return (
    <>
      <SearchInput combobox={combobox} hidden={count <= limit} placeholder={t('organization.placeholder')} />

      <SelectorItems
        combobox={combobox}
        items={organizations}
        renderItem={(organization) => (
          <SelectorItem
            selected={organization.id === currentOrganization.id}
            loading={
              switchOrganizationMutation.isPending &&
              switchOrganizationMutation.variables === organization.externalId
            }
            className="row items-center gap-2"
          >
            <div>
              <OrganizationAvatar organizationName={organization.name} className="size-4 rounded-full" />
            </div>
            <div className="truncate text-sm/4 font-medium">{organization.name}</div>
          </SelectorItem>
        )}
      />

      {showCreate && (
        <Link
          className="row w-full items-center justify-center gap-1 border-t px-3 py-2"
          to="/user/settings/organizations"
          state={{ create: true }}
          onClick={closeMenu}
        >
          <IconPlus className="size-4" />
          <T id="organization.create" />
        </Link>
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

function ProjectSelector({ closeMenu }: { closeMenu: () => void }) {
  const t = T.useTranslate();
  const queryClient = useQueryClient();

  const [inputValue, setInputValue] = useState('');

  const projects = useProjects({ search: inputValue, limit });
  const [, setCurrentProjectId] = useCurrentProjectId();
  const currentProject = useCurrentProject();

  const mutation = useMutation({
    mutationFn: async (projectId: string) => {
      await queryClient.fetchQuery(apiQuery('get /v1/projects/{id}', { path: { id: projectId } }));
      setCurrentProjectId(projectId);

      await queryClient.invalidateQueries();
      queryClient.removeQueries({ predicate: (query) => !query.isActive() });
    },
    onSuccess() {
      closeMenu();
    },
  });

  const combobox = useCombobox({
    items: projects,

    itemToString: (project) => project?.name ?? '',
    isItemDisabled: (item) => item.id === currentProject?.id,

    inputValue,
    onInputValueChange({ inputValue }) {
      setInputValue(inputValue);
    },

    selectedItem: null,
    onSelectedItemChange({ selectedItem: project }) {
      if (project) {
        mutation.mutate(project.id);
      }
    },

    stateReducer: (state, { type, changes }) => {
      switch (type) {
        case useCombobox.stateChangeTypes.ItemClick:
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
          return { ...changes, inputValue: state.inputValue };

        default:
          return changes;
      }
    },
  });

  return (
    <>
      <SearchInput combobox={combobox} hidden={false} placeholder={t('project.placeholder')} />

      <SelectorItems
        combobox={combobox}
        items={projects}
        renderItem={(project) => (
          <SelectorItem
            selected={project.id === currentProject?.id}
            loading={mutation.isPending && mutation.variables === project.id}
            className="row items-center gap-2"
          >
            <span className="truncate font-medium">{project.name}</span>
            <span className="text-xs whitespace-nowrap text-dim">
              <T id="project.services" values={{ count: project.serviceCount }} />
            </span>
          </SelectorItem>
        )}
      />

      <button
        type="button"
        className="row w-full items-center justify-center gap-1 border-t px-3 py-2"
        onClick={() => {
          closeMenu();
          openDialog('CreateProject');
        }}
      >
        <IconPlus className="size-4" />
        <T id="project.create" />
      </button>
    </>
  );
}

type SearchInputProps<T> = {
  combobox: UseComboboxReturnValue<T>;
  hidden: boolean;
  placeholder: string;
};

function SearchInput<T>({ combobox, hidden, placeholder }: SearchInputProps<T>) {
  return (
    <div className={clsx('mb-3 px-3', { hidden })}>
      <Input
        {...combobox.getInputProps()}
        type="search"
        placeholder={placeholder}
        start={
          <InputStart background={false}>
            <IconSearch className="size-4 text-dim" />
          </InputStart>
        }
      />
    </div>
  );
}

type SelectorProps<T> = {
  combobox: UseComboboxReturnValue<T>;
  items: T[];
  renderItem: (item: T) => React.ReactNode;
};

function SelectorItems<T extends { id: string }>({ combobox, items, renderItem }: SelectorProps<T>) {
  return (
    <Menu {...combobox.getMenuProps()} className="h-64 scrollbar-thin overflow-auto px-3 scrollbar-green">
      {items.map((item, index) => (
        <MenuItem
          key={item.id}
          highlighted={index === combobox.highlightedIndex}
          {...combobox.getItemProps({ item, index })}
        >
          {renderItem(item)}
        </MenuItem>
      ))}
    </Menu>
  );
}

type SelectorItemProps = {
  selected: boolean;
  loading?: boolean;
  className?: string;
  children: React.ReactNode;
};

function SelectorItem({ selected, loading, className, children }: SelectorItemProps) {
  const Icon = selected ? IconCheck : loading ? Spinner : undefined;

  return (
    <div className="row items-center gap-2 px-3 py-2">
      <div className={clsx('grow', className)}>{children}</div>

      {Icon && (
        <span className="leading-none">
          <Icon className="size-4" />
        </span>
      )}
    </div>
  );
}
