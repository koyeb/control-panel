import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/auth/signout')({
  async beforeLoad({ context: { authKit } }) {
    authKit.signOut();
    await new Promise(() => {});
  },
});
