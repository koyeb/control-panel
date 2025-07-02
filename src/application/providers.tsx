import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

import { NotificationContainer } from 'src/components/notification';
import { IntlProvider } from 'src/intl/translation-provider';
import { CommandPaletteProvider } from 'src/modules/command-palette/command-palette.provider';
import { getConfig } from 'src/utils/config';

import { auth } from './authentication';
import { DialogProvider } from './dialog-context';

const version = getConfig('version');

const persister = createAsyncStoragePersister({
  key: 'query-cache',
  storage: auth.session ? window.sessionStorage : window.localStorage,
});

type ProviderProps = {
  queryClient: QueryClient;
  children: React.ReactNode;
};

export function Providers({ queryClient, children }: ProviderProps) {
  return (
    <IntlProvider>
      <QueryClientProvider client={queryClient}>
        <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, buster: version }}>
          <DialogProvider>
            <CommandPaletteProvider>
              <ReactQueryDevtools />
              <NotificationContainer />
              {children}
            </CommandPaletteProvider>
          </DialogProvider>
        </PersistQueryClientProvider>
      </QueryClientProvider>
    </IntlProvider>
  );
}
