import { useState } from 'react';

import { Floating, IconButton, Menu } from '@koyeb/design-system';
import { IconEllipsisVertical } from 'src/components/icons';

type OnClose = () => void;
type WithClose = (cb: () => void) => OnClose;

type ActionsMenuProps = {
  Icon?: typeof IconEllipsisVertical;
  children: (withClose: WithClose, onClose: OnClose) => React.ReactNode;
};

export function ActionsMenu({ Icon = IconEllipsisVertical, children }: ActionsMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const onClose = () => setMenuOpen(false);

  const withClose: WithClose = (cb) => () => {
    onClose();
    cb();
  };

  return (
    <Floating
      open={menuOpen}
      setOpen={setMenuOpen}
      placement="bottom-end"
      offset={8}
      renderReference={(ref, props) => (
        <IconButton
          ref={ref}
          variant="ghost"
          color="gray"
          size={1}
          Icon={Icon}
          onClick={() => setMenuOpen(true)}
          {...props}
        />
      )}
      renderFloating={(ref, props) => (
        <Menu ref={ref} className="min-w-24" {...props}>
          {children(withClose, onClose)}
        </Menu>
      )}
    />
  );
}
