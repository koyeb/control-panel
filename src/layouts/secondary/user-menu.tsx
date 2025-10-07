import { ButtonMenuItem, Floating, Menu } from '@koyeb/design-system';
import { useState } from 'react';

import { useLogoutMutation, useUser } from 'src/api';
import { LinkMenuItem } from 'src/components/link';
import { UserAvatar } from 'src/components/user-avatar';
import { IconLogOut, IconSettings } from 'src/icons';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('layouts.secondary.header');

export function UserMenu() {
  const user = useUser();
  const logout = useLogoutMutation();

  const [open, setOpen] = useState(false);

  return (
    <Floating
      open={open}
      setOpen={setOpen}
      placement="bottom-end"
      offset={8}
      renderReference={(props) => (
        <button type="button" onClick={() => setOpen(true)} {...props}>
          <UserAvatar user={user} />
        </button>
      )}
      renderFloating={(props) => (
        <Menu className="min-w-48" {...props}>
          {user && (
            <LinkMenuItem
              to="/"
              search={{ settings: 'true' }}
              onClick={() => setOpen(false)}
              className="row gap-2"
            >
              <IconSettings className="icon" />
              <T id="settings" />
            </LinkMenuItem>
          )}

          <ButtonMenuItem onClick={() => logout.mutate()} className="row gap-2">
            <IconLogOut className="icon" />
            <T id="logOut" />
          </ButtonMenuItem>
        </Menu>
      )}
    />
  );
}
