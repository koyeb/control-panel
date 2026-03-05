import { createFileRoute } from '@tanstack/react-router';

import { createEnsureApiQueryData } from 'src/api';
import { GeneralSettingsPage } from 'src/pages/settings/organization/general/general-settings.page';

export const Route = createFileRoute('/_main/settings/')({
  component: GeneralSettingsPage,

  async beforeLoad({ context: { queryClient, organization } }) {
    const ensureApiQueryData = createEnsureApiQueryData(queryClient);

    if (organization !== undefined) {
      await ensureApiQueryData('get /v1/projects/{id}', { path: { id: organization.defaultProjectId } });
    }
  },
});
