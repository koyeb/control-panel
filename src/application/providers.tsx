import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { IntlProvider } from 'src/intl/translation-provider';
import { CommandPaletteProvider } from 'src/modules/command-palette/command-palette.provider';

import { AuthProvider } from './authentication';
import { DialogProvider } from './dialog-context';

type ProviderProps = {
  queryClient: QueryClient;
  children: React.ReactNode;
};

export function Providers({ queryClient, children }: ProviderProps) {
  return (
    <IntlProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <DialogProvider>
            <CommandPaletteProvider>{children}</CommandPaletteProvider>
          </DialogProvider>
        </AuthProvider>
      </QueryClientProvider>
    </IntlProvider>
  );
}
