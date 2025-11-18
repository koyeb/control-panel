import { useQueryClient } from '@tanstack/react-query';
import { WorkOsWidgets } from '@workos-inc/widgets';

import { getConfig } from 'src/application/config';
import { useThemeMode } from 'src/hooks/theme';

import '@radix-ui/themes/styles.css';
import '@workos-inc/widgets/styles.css';
import 'src/workos.css';

export default function WorkOSWidgetsProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const theme = useThemeMode();

  return (
    <WorkOsWidgets
      queryClient={queryClient}
      apiHostname={getConfig('workOsApiHost')}
      theme={{
        appearance: theme === 'system' ? 'inherit' : theme,
        fontFamily: 'var(--font-sans)',
        accentColor: 'green',
        grayColor: 'slate',
      }}
    >
      {children}
    </WorkOsWidgets>
  );
}
