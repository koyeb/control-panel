import clsx from 'clsx';
import IconCheck from 'lucide-static/icons/circle-check.svg?react';
import { useMemo } from 'react';

import { useDropdown } from './use-dropdown';

type DropdownProps<Item> = {
  dropdown: ReturnType<typeof useDropdown>;
  items: Item[];
  selectedItem: Item | undefined;
  highlightedIndex: number | undefined;
  getMenuProps: (props: React.HTMLProps<HTMLUListElement>) => React.HTMLProps<HTMLUListElement>;
  getItemProps: (props: { item: Item; index: number }) => React.HTMLProps<HTMLLIElement>;
  getKey: (item: Item) => React.Key;
  renderItem: (item: Item, index: number) => React.ReactNode;
  renderNoItems?: () => React.ReactNode;
  onItemClick?: (item: Item) => void;
};

export function Dropdown<Item>({
  dropdown,
  items,
  selectedItem,
  highlightedIndex,
  getMenuProps,
  getItemProps,
  getKey,
  renderItem,
  renderNoItems,
  onItemClick,
}: DropdownProps<Item>) {
  const { open, placement, styles, setFloating } = dropdown;

  const menuProps = useMemo(() => {
    return getMenuProps({ ref: setFloating });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setFloating]);

  return (
    <ul
      style={styles}
      className={clsx(
        'z-10 max-h-40 overflow-y-auto border bg-neutral p-1 pe-0.5 shadow-md',
        !open && 'hidden',
        placement.startsWith('top') && 'rounded-t-lg border-b-0',
        placement.startsWith('bottom') && 'rounded-b-lg border-t-0',
      )}
      {...menuProps}
    >
      {items.map((item, index) => (
        <li key={getKey(item)} className="row cursor-pointer items-center" {...getItemProps({ item, index })}>
          <div
            className={clsx('flex-1 break-all rounded p-1', index === highlightedIndex && 'bg-muted')}
            onClick={() => onItemClick?.(item)}
          >
            {renderItem(item, index)}
          </div>

          <div className="px-1">
            {item === selectedItem && <IconCheck className="icon" />}
            {item !== selectedItem && <span className="icon inline-block" />}
          </div>
        </li>
      ))}

      {items.length === 0 && renderNoItems && (
        <li className="py-2 text-center font-medium text-dim">{renderNoItems()}</li>
      )}
    </ul>
  );
}
