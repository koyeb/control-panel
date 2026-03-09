import { Alert } from '@koyeb/design-system';
import { Link } from '@tanstack/react-router';

import { useOrganization } from 'src/api';
import { useCurrentProject } from 'src/api/hooks/project';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.projectSettings.defaultProject');

export function DefaultProjectAlert() {
  const organization = useOrganization();
  const project = useCurrentProject();

  const organizationSettingsLink = (children: React.ReactNode) => (
    <Link to="/settings" className="text-blue">
      {children}
    </Link>
  );

  if (project?.id === organization?.defaultProjectId) {
    return (
      <Alert
        variant="info"
        style="outline"
        description={<T id="info" values={{ link: organizationSettingsLink }} />}
      />
    );
  }

  return null;
}
