import { ButtonMenuItem, Floating, Menu, MenuItem } from '@koyeb/design-system';
import { useState } from 'react';

import { useLogoutMutation, useUserUnsafe } from 'src/api/hooks/session';
import { routes } from 'src/application/routes';
import { IconLogOut, IconSettings } from 'src/components/icons';
import { Link } from 'src/components/link';
import { UserAvatar } from 'src/components/user-avatar';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('layouts.secondary.header');

export function UserMenu() {
  const user = useUserUnsafe();
  const logout = useLogoutMutation(routes.signIn());

  const [open, setOpen] = useState(false);

  return (
    <Floating
      open={open}
      setOpen={setOpen}
      placement="bottom-end"
      offset={8}
      renderReference={(props) => (
        <button type="button" onClick={() => setOpen(true)} className="ml-auto" {...props}>
          <UserAvatar user={user} />
        </button>
      )}
      renderFloating={(props) => (
        <Menu className="min-w-48" {...props}>
          <MenuItem element={Link} to={'?settings'} onClick={() => setOpen(false)} className="row gap-2">
            <IconSettings className="icon" />
            <T id="settings" />
          </MenuItem>

          <ButtonMenuItem onClick={() => logout.mutate()} className="row gap-2">
            <IconLogOut className="icon" />
            <T id="logOut" />
          </ButtonMenuItem>
        </Menu>
      )}
    />
  );
}
