import { createFileRoute } from '@tanstack/react-router';

import { GeneralSettingsPage } from 'src/pages/settings/user/general-settings.page';

export const Route = createFileRoute('/_main/user/settings/')({
  component: () => <GeneralSettingsPage />,
});
