import { createTranslate } from 'src/intl/translate';
import { ComputeDeployment } from 'src/model';

const T = createTranslate('pages.service.overview.deploymentTrigger');

export function DeploymentTrigger({ deployment }: { deployment: ComputeDeployment }) {
  const { trigger } = deployment;

  if (trigger?.type == 'git') {
    return trigger.commit.message;
  }

  return <T id={trigger?.type ?? 'redeploy'} />;
}
