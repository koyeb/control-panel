import { Outlet, createFileRoute } from '@tanstack/react-router';

import { UserSettingsLayout } from 'src/pages/settings/user/user-settings.layout';

export const Route = createFileRoute('/_main/user/settings')({
  component: () => (
    <UserSettingsLayout>
      <Outlet />
    </UserSettingsLayout>
  ),
});
