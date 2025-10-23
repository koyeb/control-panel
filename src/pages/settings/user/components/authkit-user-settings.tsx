import { useQueryClient } from '@tanstack/react-query';
import { UserProfile, UserSecurity, WorkOsWidgets } from '@workos-inc/widgets';

import { getToken } from 'src/application/token';

import '@radix-ui/themes/styles.css';
import '@workos-inc/widgets/styles.css';

import { useThemeMode } from 'src/hooks/theme';

import './authkit.css';

export function AuthKitUserSettings() {
  const token = getToken();
  const queryClient = useQueryClient();
  const theme = useThemeMode();

  if (!token) {
    return null;
  }

  return (
    <WorkOsWidgets
      queryClient={queryClient}
      theme={{
        appearance: theme === 'system' ? 'inherit' : theme,
        fontFamily: 'var(--font-sans)',
        accentColor: 'green',
        grayColor: 'slate',
      }}
    >
      <div className="col gap-8">
        <UserProfile authToken={token} />
        <UserSecurity authToken={token} />
      </div>
    </WorkOsWidgets>
  );
}
