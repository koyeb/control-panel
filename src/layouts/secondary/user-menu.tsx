import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { ButtonMenuItem, Floating, Menu, MenuItem } from '@koyeb/design-system';
import { useUserUnsafe } from 'src/api/hooks/session';
import { useApiMutationFn } from 'src/api/use-api';
import { useResetIdentifyUser } from 'src/application/posthog';
import { routes } from 'src/application/routes';
import { useToken } from 'src/application/token';
import { IconLogOut, IconSettings } from 'src/components/icons';
import { Link } from 'src/components/link';
import { UserAvatar } from 'src/components/user-avatar';
import { useNavigate } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('layouts.secondary.header');

export function UserMenu() {
  const { clearToken } = useToken();
  const user = useUserUnsafe();

  const [open, setOpen] = useState(false);
  const resetIdentify = useResetIdentifyUser();
  const navigate = useNavigate();

  const { mutate: logout } = useMutation({
    ...useApiMutationFn('logout', {}),
    onSuccess() {
      clearToken();
      resetIdentify();
      navigate(routes.signIn());
    },
  });

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
          <MenuItem element={Link} href={'?settings'} onClick={() => setOpen(false)} className="row gap-2">
            <IconSettings className="icon" />
            <T id="settings" />
          </MenuItem>

          <ButtonMenuItem onClick={() => logout()} className="row gap-2">
            <IconLogOut className="icon" />
            <T id="logOut" />
          </ButtonMenuItem>
        </Menu>
      )}
    />
  );
}
