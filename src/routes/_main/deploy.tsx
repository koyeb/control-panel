import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_main/deploy')({
  beforeLoad: ({ search }) => {
    throw redirect({ to: '/services/deploy', search });
  },
});
