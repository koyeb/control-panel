import { createFileRoute } from '@tanstack/react-router';
import { CreateServicePage } from 'src/pages/service/create-service.page';

export const Route = createFileRoute('/_main/services/new')({
  component: CreateServicePage,
});
