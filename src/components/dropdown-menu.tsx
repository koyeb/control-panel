import {
  FloatingPortal,
  safePolygon,
  useDismiss,
  useHover,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import { Dropdown, IconButton, Menu, MenuItem, UseDropdownProps, useDropdown } from '@koyeb/design-system';
import { createLink } from '@tanstack/react-router';
import clsx from 'clsx';
import { merge } from 'lodash-es';
import { useState } from 'react';

import { stopPropagation, withStopPropagation } from 'src/application/dom-events';
import { SvgComponent } from 'src/application/types';
import { IconEllipsisVertical } from 'src/icons';

import { ExternalLink } from './link';

type DropdownMenuProps = {
  openOnHover?: boolean;
  closeOnClick?: boolean;
  dropdown?: UseDropdownProps;
  reference: (props: Record<string, unknown>) => React.ReactNode;
  children: React.ReactNode;
};

export function DropdownMenu({
  openOnHover,
  closeOnClick = true,
  dropdown: dropdownProp,
  reference,
  children,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);

  const dropdown = useDropdown(
    merge(
      {
        offset: 4,
        flip: true,
        floating: {
          open: open,
          onOpenChange: setOpen,
          placement: 'bottom-start',
        },
      },
      dropdownProp,
    ),
  );

  const dismiss = useDismiss(dropdown.context, { outsidePressEvent: 'mousedown' });
  const role = useRole(dropdown.context, { role: 'menu' });
  const hover = useHover(dropdown.context, { enabled: Boolean(openOnHover), handleClose: safePolygon() });

  const { getReferenceProps, getFloatingProps } = useInteractions([dismiss, role, hover]);

  return (
    <>
      {reference(
        getReferenceProps({
          ref: dropdown.refs.setReference,
          onClick: withStopPropagation(() => setOpen(true)),
        }),
      )}

      <FloatingPortal root={document.getElementById('root')}>
        {dropdown.transition.isMounted && (
          <Dropdown
            {...getFloatingProps()}
            dropdown={dropdown}
            onClick={stopPropagation}
            className="min-w-48"
          >
            <Menu onClick={() => closeOnClick && setOpen(false)}>{children}</Menu>
          </Dropdown>
        )}
      </FloatingPortal>
    </>
  );
}

export function ActionsMenu(props: Omit<DropdownMenuProps, 'reference'> & { Icon?: SvgComponent }) {
  return (
    <DropdownMenu
      reference={(props) => (
        <IconButton {...props} variant="ghost" color="gray" size={1} Icon={IconEllipsisVertical} />
      )}
      {...props}
    />
  );
}

export function LabelMenuItem({ className, ...props }: React.ComponentProps<'li'>) {
  return <MenuItem className={clsx(className, 'pointer-events-none py-2 text-dim')} {...props} />;
}

export function ButtonMenuItem({ className, ...props }: React.ComponentProps<'button'>) {
  return (
    <MenuItem className={clsx(props.disabled ? 'text-dim' : 'hover:bg-muted')}>
      <button {...props} className={clsx(className, 'row w-full items-center gap-2 py-1 text-start')} />
    </MenuItem>
  );
}

function NativeLinkMenuItem({ className, ...props }: React.ComponentProps<'a'>) {
  return (
    <MenuItem className={clsx(props.href ? 'hover:bg-muted' : 'cursor-default! text-dim')}>
      <a {...props} className={clsx(className, 'row w-full items-center gap-2 py-1')} />
    </MenuItem>
  );
}

export const LinkMenuItem = createLink(NativeLinkMenuItem);

export function ExternalLinkMenuItem({ className, ...props }: React.ComponentProps<typeof ExternalLink>) {
  return (
    <MenuItem className="hover:bg-muted">
      <ExternalLink {...props} className={clsx(className, 'row w-full items-center gap-2 py-1')} />
    </MenuItem>
  );
}
