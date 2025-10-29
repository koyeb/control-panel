import { createFileRoute } from '@tanstack/react-router';

import { OneClickAppPage } from 'src/pages/one-click-apps/one-click-app.page';

export const Route = createFileRoute('/_main/one-clicks/$slug/')({
  component: function Component() {
    const { slug } = Route.useParams();

    return <OneClickAppPage slug={slug} />;
  },
});
