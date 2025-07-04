import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

import { MainLayout } from 'src/layouts/main/main-layout';

export const Route = createFileRoute('/_main')({
  component: () => (
    <MainLayout>
      <Outlet />
    </MainLayout>
  ),

  beforeLoad({ location, context }) {
    const { auth } = context;

    if (auth.token === null) {
      const next = location.pathname !== '/' ? location.href : undefined;

      throw redirect({
        to: '/auth/signin',
        search: { next },
      });
    }
  },
});
