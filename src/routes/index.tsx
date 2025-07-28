import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: function Component() {
    return <div>Index</div>;
  },
});
