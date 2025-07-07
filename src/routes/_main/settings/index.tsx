import { createFileRoute } from '@tanstack/react-router';

import { GeneralSettingsPage } from 'src/pages/settings/organization/general/general-settings.page';

export const Route = createFileRoute('/_main/settings/')({
  component: GeneralSettingsPage,
});
