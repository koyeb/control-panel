import clsx from 'clsx';
import { Fragment, useMemo } from 'react';

import { useDropdown } from './use-dropdown';

type DropdownCommonProps<Item> = {
  dropdown: ReturnType<typeof useDropdown>;
  highlightedIndex: number | undefined;
  getMenuProps: (props: Record<string, unknown>) => React.HTMLProps<HTMLUListElement>;
  getItemProps: (props: { item: Item; index: number }) => React.HTMLProps<HTMLLIElement>;
  getKey: (item: Item) => React.Key;
  renderItem: (item: Item, index: number) => React.ReactNode;
  renderNoItems?: () => React.ReactNode;
  onItemClick?: (item: Item) => void;
};

export type DropdownGroup<Item> = {
  label: React.ReactNode;
  key: React.Key;
  items: Item[];
};

type DropdownProps<Item> = DropdownCommonProps<Item> &
  ({ items: Item[] } | { groups: Array<DropdownGroup<Item>> });

export function Dropdown<Item>(props: DropdownProps<Item>) {
  const { open, placement, styles, setFloating } = props.dropdown;

  const menuProps = useMemo(() => {
    return props.getMenuProps({ ref: setFloating });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setFloating]);

  return (
    <ul
      style={styles}
      className={clsx(
        'z-50 max-h-40 overflow-y-auto border bg-neutral p-1 pe-0.5 shadow-md',
        !open && 'hidden',
        placement.startsWith('top') && 'rounded-t-lg border-b-0',
        placement.startsWith('bottom') && 'rounded-b-lg border-t-0',
      )}
      {...menuProps}
    >
      {'items' in props &&
        props.items.map((item, index) => (
          <Item key={props.getKey(item)} item={item} index={index} {...props} />
        ))}

      {'items' in props && props.items.length === 0 && props.renderNoItems && (
        <li>{props.renderNoItems()}</li>
      )}

      {'groups' in props && <Groups {...props} />}
    </ul>
  );
}

type ItemProps<Item> = Pick<
  DropdownCommonProps<Item>,
  'getItemProps' | 'highlightedIndex' | 'onItemClick' | 'renderItem'
> & {
  item: Item;
  index: number;
  className?: string;
};

export function Item<Item>({
  index,
  item,
  getItemProps,
  highlightedIndex,
  onItemClick,
  renderItem,
  className,
}: ItemProps<Item>) {
  return (
    <li
      className={clsx('row cursor-pointer items-center aria-disabled:cursor-default', className)}
      {...getItemProps({ item, index })}
    >
      <div
        className={clsx('flex-1 break-all rounded p-1', index === highlightedIndex && 'bg-muted')}
        onClick={() => onItemClick?.(item)}
      >
        {renderItem(item, index)}
      </div>
    </li>
  );
}

type GroupProps<Item> = Pick<DropdownCommonProps<Item>, 'renderNoItems'> &
  Omit<ItemProps<Item>, 'item' | 'index' | 'className'> & {
    getKey: (item: Item) => React.Key;
    groups: Array<DropdownGroup<Item>>;
  };

export function Groups<Item>({ getKey, groups, ...props }: GroupProps<Item>) {
  return groups.reduce<{ sections: React.ReactNode[]; offset: number }>(
    (result, { key, label, items }) => {
      result.sections.push(
        <Fragment key={key}>
          <GroupLabel>{label}</GroupLabel>

          {items.map((item, index) => (
            <Item key={getKey(item)} item={item} index={index + result.offset} {...props} />
          ))}

          {items.length === 0 && props.renderNoItems?.()}
        </Fragment>,
      );

      result.offset += items.length;

      return result;
    },
    { sections: [], offset: 0 },
  ).sections;
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return <li className="py-1 font-medium text-dim">{children}</li>;
}
