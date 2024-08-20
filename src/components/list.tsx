import clsx from 'clsx';
import { forwardRef } from 'react';
import { Fragment } from 'react/jsx-runtime';

type ListSection<Item> = {
  title: React.ReactNode;
  items: Array<Item>;
};

type ListProps<Item> = {
  sections: Array<ListSection<Item>>;
  getKey?: (item: Item) => React.Key;
  renderItem: (item: Item, index: number) => React.ReactNode;
};

export function ListSections<Item>({ sections, getKey, renderItem }: ListProps<Item>) {
  return (
    <>
      {sections.map((section, index) => (
        <Fragment key={index}>
          <div className="px-3 py-2 font-semibold text-dim">{section.title}</div>
          <ul>
            {section.items.map((item, index) => (
              <Fragment key={getKey?.(item) ?? index}>{renderItem(item, index)}</Fragment>
            ))}
          </ul>
        </Fragment>
      ))}
    </>
  );
}

type ListItemProps = React.ComponentProps<'li'> & {
  isActive?: boolean;
  start?: React.ReactNode;
  end?: React.ReactNode;
  children: React.ReactNode;
};

export const ListItem = forwardRef<HTMLLIElement, ListItemProps>(function ListItem(
  { isActive, className, start, end, children, ...props },
  ref,
) {
  return (
    <li
      ref={ref}
      className={clsx('row gap-3 rounded-lg px-3 py-2 font-medium', isActive && 'bg-muted', className)}
      {...props}
    >
      {start}
      {children}
      {end && <div className="ml-auto">{end}</div>}
    </li>
  );
});
