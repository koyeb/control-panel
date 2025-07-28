import { createFileRoute } from '@tanstack/react-router';
import z from 'zod';

import { CreateDatabasePage } from 'src/pages/databases/create-database.page';

export const Route = createFileRoute('/_main/database-services/new')({
  component: CreateDatabasePage,

  validateSearch: z.object({
    app_id: z.string().optional(),
  }),
});
