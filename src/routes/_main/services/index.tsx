import { createFileRoute } from '@tanstack/react-router';

import { ServicesPage } from 'src/pages/home/services.page';

export const Route = createFileRoute('/_main/services/')({
  component: ServicesPage,
});
