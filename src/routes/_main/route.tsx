import { Outlet, createFileRoute } from '@tanstack/react-router';

import { MainLayout } from 'src/layouts/main/main-layout';

export const Route = createFileRoute('/_main')({
  component: () => (
    <MainLayout>
      <Outlet />
    </MainLayout>
  ),
});
