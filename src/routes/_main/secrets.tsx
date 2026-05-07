import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_main/secrets')({
  beforeLoad: () => {
    throw redirect({ to: '/project/secrets' });
  },
});
