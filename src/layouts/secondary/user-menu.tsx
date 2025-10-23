import { useLogoutMutation, useUser } from 'src/api';
import { ButtonMenuItem, DropdownMenu, LinkMenuItem } from 'src/components/dropdown-menu';
import { UserAvatar } from 'src/components/user-avatar';
import { IconLogOut, IconSettings } from 'src/icons';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('layouts.secondary.header');

export function UserMenu() {
  const user = useUser();
  const logout = useLogoutMutation();

  return (
    <DropdownMenu
      reference={(props) => (
        <button type="button" {...props}>
          <UserAvatar user={user} />
        </button>
      )}
    >
      {user && (
        <LinkMenuItem to="/" search={{ settings: 'true' }} className="row gap-2">
          <IconSettings className="icon" />
          <T id="settings" />
        </LinkMenuItem>
      )}

      <ButtonMenuItem onClick={() => logout.mutate()} className="row gap-2">
        <IconLogOut className="icon" />
        <T id="logOut" />
      </ButtonMenuItem>
    </DropdownMenu>
  );
}
