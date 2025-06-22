import { createFileRoute } from '@tanstack/react-router';
import { DeployPage } from 'src/pages/service/deploy/deploy.page';

export const Route = createFileRoute('/_main/services/deploy')({
  component: DeployPage,
});
