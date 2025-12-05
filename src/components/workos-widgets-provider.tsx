import { WorkOsWidgets } from '@workos-inc/widgets';

import { getConfig } from 'src/application/config';
import { useThemeMode } from 'src/hooks/theme';

import '@radix-ui/themes/styles.css';
import '@workos-inc/widgets/styles.css';

import { useAuth } from '@workos-inc/authkit-react';
import { useEffect, useState } from 'react';

import 'src/workos.css';

type WorkOSWidgetsProviderProps = {
  children: (token: string) => React.ReactNode;
};

export default function WorkOSWidgetsProvider({ children }: WorkOSWidgetsProviderProps) {
  const theme = useThemeMode();
  const authKit = useAuth();

  const [token, setToken] = useState<string>();

  useEffect(() => {
    void authKit.getAccessToken().then(setToken);
  }, [authKit]);

  if (!token) {
    return null;
  }

  return (
    <WorkOsWidgets
      apiHostname={getConfig('workOsApiHost')}
      theme={{
        appearance: theme === 'system' ? 'inherit' : theme,
        fontFamily: 'var(--font-sans)',
        accentColor: 'green',
        grayColor: 'slate',
      }}
    >
      {children(token)}
    </WorkOsWidgets>
  );
}
