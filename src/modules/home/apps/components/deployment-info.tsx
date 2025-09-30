import { isComputeDeployment, isDatabaseDeployment } from 'src/api';
import { TextSkeleton } from 'src/components/skeleton';
import { IconDatabase } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { ComputeDeployment, DatabaseDeployment, Deployment } from 'src/model';

import { DeploymentRegions } from './deployment-regions';
import { DeploymentSource } from './deployment-source';

const T = createTranslate('pages.home');

export function DeploymentInfo({ deployment }: { deployment?: Deployment }) {
  if (deployment === undefined) {
    return <DeploymentInfoSkeleton />;
  }

  if (isComputeDeployment(deployment)) {
    return <ComputeDeploymentInfo deployment={deployment} />;
  }

  if (isDatabaseDeployment(deployment)) {
    return <DatabaseDeploymentInfo deployment={deployment} />;
  }

  return null;
}

function ComputeDeploymentInfo({ deployment }: { deployment: ComputeDeployment }) {
  return (
    <div className="col gap-2 whitespace-nowrap">
      <div>
        <DeploymentRegions regions={deployment.definition.regions} />
      </div>
      <div>
        <DeploymentSource source={deployment.definition.source} />
      </div>
    </div>
  );
}

function DatabaseDeploymentInfo({ deployment }: { deployment: DatabaseDeployment }) {
  return (
    <div className="col gap-2 whitespace-nowrap">
      <div>
        <DeploymentRegions regions={[deployment.region]} />
      </div>
      <div>
        <div className="row items-center gap-2">
          <IconDatabase className="size-3.5" />
          <T id="postgresVersion" values={{ version: deployment.postgresVersion }} />
        </div>
      </div>
    </div>
  );
}

function DeploymentInfoSkeleton() {
  return (
    <div className="col gap-2">
      <TextSkeleton width={8} />
      <TextSkeleton width={10} />
    </div>
  );
}
