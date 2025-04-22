import {
  flip,
  FloatingPortal,
  offset,
  size,
  useFloating,
  UseFloatingOptions,
  useTransitionStyles,
  UseTransitionStylesProps,
} from '@floating-ui/react';
import clsx from 'clsx';
import * as downshift from 'downshift';
import IconChevronUpDown from 'lucide-static/icons/chevrons-up-down.svg?react';
import { createContext, CSSProperties, useContext } from 'react';

import { Field } from '../field/field';
import { InputBox } from '../input/input';

/* eslint-disable react-refresh/only-export-components */

type Combobox<T> = ReturnType<typeof downshift.useCombobox<T>>;
type Floating = ReturnType<typeof useFloating>;
type FloatingTransition = { isMounted: boolean; styles: CSSProperties };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ComboboxContext = Combobox<any> & {
  floating: Floating;
  transition: FloatingTransition;
};

const comboboxContext = createContext<ComboboxContext | null>(null);

export const Combobox = {
  stateChangeTypes: downshift.useCombobox.stateChangeTypes,
  context: comboboxContext,
  Provider: comboboxContext.Provider,
  useCombobox,
  Root,
  Input,
  Dropdown,
  Menu,
  MenuItem,
  DropdownMenu,
};

function useCombobox<T>(
  comboboxProps: downshift.UseComboboxProps<T>,
  floatingProps?: UseFloatingOptions,
  transitionProps?: UseTransitionStylesProps,
): ComboboxContext {
  const combobox = downshift.useCombobox(comboboxProps);

  const floating = useFloating({
    open: combobox.isOpen,
    placement: 'bottom-start',
    middleware: [
      offset(4),
      flip(),
      size({
        apply({ rects, elements }) {
          Object.assign(elements.floating.style, {
            width: `${rects.reference.width}px`,
          });
        },
      }),
    ],
    ...floatingProps,
  });

  const transition = useTransitionStyles(floating.context, {
    duration: 120,
    ...transitionProps,
  });

  return {
    ...combobox,
    floating,
    transition,
  };
}

type ComboboxProps<T> = {
  items: T[];
  combobox?: Omit<downshift.UseComboboxProps<T>, 'items'>;
  floating?: UseFloatingOptions;
  transition?: UseTransitionStylesProps;
  input?: React.ReactNode;
  root?: HTMLElement;
  children: React.ReactNode;
};

function Root<T>({
  items,
  combobox,
  floating,
  transition,
  input = <Combobox.Input />,
  root,
  children,
}: ComboboxProps<T>) {
  const value = Combobox.useCombobox({ items, ...combobox }, floating, transition);

  return (
    <Combobox.Provider value={value}>
      <Field ref={value.floating.refs.setReference}>{input}</Field>
      <FloatingPortal root={root}>{children}</FloatingPortal>
    </Combobox.Provider>
  );
}

function Input({ start, ...props }: React.ComponentProps<typeof InputBox>) {
  const combobox = useContext(comboboxContext);

  return (
    <InputBox
      {...combobox?.getInputProps(props)}
      start={start}
      end={
        <button {...combobox?.getToggleButtonProps()} className="px-2">
          <IconChevronUpDown className="size-4" />
        </button>
      }
    />
  );
}

function Dropdown({ className, ...props }: React.ComponentProps<'div'>) {
  const combobox = useContext(comboboxContext);

  return (
    <div
      ref={combobox?.floating.refs.setFloating}
      style={{ ...combobox?.floating.floatingStyles, ...combobox?.transition.styles }}
      className={clsx(
        'z-50 rounded-md border bg-neutral shadow-md',
        { hidden: !combobox?.transition.isMounted },
        className,
      )}
      {...props}
    />
  );
}

function Menu({ className, ...props }: React.ComponentProps<'ul'>) {
  const combobox = useContext(comboboxContext);

  return <ul {...combobox?.getMenuProps(props)} className={clsx('p-1', className)} />;
}

function MenuItem<T>({ className, ...props }: { item: T } & React.ComponentProps<'li'>) {
  const combobox = useContext(comboboxContext);

  return (
    <li
      {...combobox?.getItemProps(props)}
      className={clsx(
        'row cursor-pointer items-center rounded-md px-2 py-1 aria-disabled:cursor-default aria-selected:bg-muted',
        className,
      )}
    />
  );
}

type DropdownMenuProps<T> = {
  items: T[];
  getKey: (item: T) => React.Key;
  renderItem: (item: T) => React.ReactNode;
};

function DropdownMenu<T>({ items, getKey, renderItem }: DropdownMenuProps<T>) {
  return (
    <Dropdown>
      <Menu>
        {items.map((item) => (
          <MenuItem key={getKey(item)} item={item}>
            {renderItem(item)}
          </MenuItem>
        ))}
      </Menu>
    </Dropdown>
  );
}
