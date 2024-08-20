import { ComputeDeployment } from 'src/api/model';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('pages.service.overview.deploymentTrigger');

export function DeploymentTrigger({ deployment }: { deployment: ComputeDeployment }) {
  const { trigger } = deployment;

  if (trigger?.type == 'git') {
    return trigger.commit.message;
  }

  return <T id={trigger?.type ?? 'redeploy'} />;
}
