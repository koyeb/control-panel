import { ComputeDeployment } from 'src/api/model';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.service.overview.deploymentTrigger');

export function DeploymentTrigger({ deployment }: { deployment: ComputeDeployment }) {
  const { trigger } = deployment;

  if (trigger?.type == 'git') {
    return trigger.commit.message;
  }

  return <T id={trigger?.type ?? 'redeploy'} />;
}
