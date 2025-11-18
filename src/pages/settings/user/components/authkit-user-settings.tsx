import { UserProfile, UserSecurity } from '@workos-inc/widgets';
import { lazy } from 'react';

import { useAuthkitToken } from 'src/application/token';

const WorkOSWidgetsProvider = lazy(() => import('src/components/workos-widgets-provider'));

export function AuthKitUserSettings() {
  const token = useAuthkitToken();

  if (!token) {
    return null;
  }

  return (
    <WorkOSWidgetsProvider>
      <div className="col gap-8">
        <UserProfile authToken={token} />
        <UserSecurity authToken={token} />
      </div>
    </WorkOSWidgetsProvider>
  );
}
