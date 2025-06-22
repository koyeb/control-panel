import { createFileRoute } from '@tanstack/react-router';

import { HomePage } from 'src/pages/home/home.page';

export const Route = createFileRoute('/_main/')({
  component: HomePage,
});
