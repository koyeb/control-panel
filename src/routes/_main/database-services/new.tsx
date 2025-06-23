import { createFileRoute } from '@tanstack/react-router';
import { getBreadcrumb } from 'src/layouts/main/app-breadcrumbs';
import { CreateDatabasePage } from 'src/pages/databases/create-database.page';
import { z } from 'zod';

export const Route = createFileRoute('/_main/database-services/new')({
  component: CreateDatabasePage,

  validateSearch: z.object({
    app_id: z.string().optional(),
  }),

  beforeLoad: ({ context, location }) => {
    return {
      breadcrumb: getBreadcrumb(location, 'createService'),
    };
  },
});
