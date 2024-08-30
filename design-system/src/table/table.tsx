import clsx from 'clsx';
import { Fragment } from 'react/jsx-runtime';

type TableColumn<Item> = {
  render: (item: Item) => React.ReactNode;
  hidden?: boolean;
  header?: React.ReactNode;
  className?: string;
  headerClassName?: string;
};

type TableProps<Item, Column extends string> = {
  items: Item[];
  columns: Record<Column, TableColumn<Item>>;
  getKey?: (item: Item) => React.Key | undefined;
  onRowClick?: (item: Item) => void;
  isExpanded?: (item: Item) => boolean;
  renderExpanded?: (item: Item) => React.ReactNode;
  classes?: Partial<
    Record<'table' | 'thead' | 'tbody', string> & Record<'tr' | 'th' | 'td', (item: Item | null) => string>
  >;
};

export function Table<Item, Column extends string>({
  items,
  columns,
  getKey = defaultGetKey,
  onRowClick,
  isExpanded,
  renderExpanded,
  classes,
}: TableProps<Item, Column>) {
  const columnsArray = Object.entries<TableColumn<Item>>(columns).filter(([, value]) => !value.hidden);

  return (
    <table className={clsx('table', classes?.table)}>
      <thead className={classes?.thead}>
        <tr className={classes?.tr?.(null)}>
          {columnsArray.map(([key, column]) => (
            <th key={key} className={clsx(column.headerClassName, classes?.th?.(null))}>
              {column.header}
            </th>
          ))}
        </tr>
      </thead>

      <tbody className={classes?.tbody}>
        {items.map((item, index) => (
          <Fragment key={getKey(item) ?? index}>
            <tr
              aria-expanded={isExpanded?.(item)}
              onClick={() => onRowClick?.(item)}
              className={clsx(classes?.tr?.(item), onRowClick && 'cursor-pointer')}
            >
              {columnsArray.map(([key, column]) => (
                <td key={key} className={clsx(classes?.td?.(item), column.className)}>
                  {column.render(item)}
                </td>
              ))}
            </tr>

            {isExpanded?.(item) && (
              <tr className="hover:!bg-inherit">
                <td colSpan={columnsArray.length} className="!border-t-0">
                  {renderExpanded?.(item)}
                </td>
              </tr>
            )}
          </Fragment>
        ))}
      </tbody>
    </table>
  );
}

function defaultGetKey<T>(item: T): React.Key | undefined {
  if (typeof item !== 'object' || item === null) {
    return;
  }

  if ('id' in item && typeof item.id === 'string') {
    return item.id;
  }
}
