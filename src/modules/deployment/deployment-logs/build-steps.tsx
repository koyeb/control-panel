import clsx from 'clsx';

import { ComputeDeployment, DeploymentBuildStep } from 'src/api/model';
import { useNow } from 'src/hooks/timers';
import { Translate } from 'src/intl/translate';

import { buildStatusMap } from './deployment-status-icons';

const T = Translate.prefix('deploymentLogs.build');

type BuildStepsProps = {
  deployment: ComputeDeployment;
};

export function BuildSteps({ deployment }: BuildStepsProps) {
  const steps = deployment.build?.steps;

  if (steps === undefined) {
    return null;
  }

  return (
    <div className="col gap-4 lg:gap-2">
      {steps.map((step) => (
        <BuildStep key={step.name} step={step} />
      ))}
    </div>
  );
}

function BuildStep({ step }: { step: DeploymentBuildStep }) {
  const [StatusIcon, statusColorClassName] = buildStatusMap[step.status];

  const elapsed = (className?: string) => {
    if (step.startedAt === null) {
      return;
    }

    return (
      <div className={clsx('ml-auto text-dim', className)}>
        <T id="elapsed" values={{ time: <Elapsed start={step.startedAt} finish={step.finishedAt} /> }} />
      </div>
    );
  };

  return (
    <div className="col lg:row gap-2">
      <div className="row min-w-48 items-center gap-2">
        <StatusIcon className={clsx('size-4', statusColorClassName)} />
        <Translate id={`common.deploymentBuildStep.${step.name}`} />
        {elapsed(clsx('lg:hidden'))}
      </div>

      <div className="text-dim">{step.messages.join(' ')}</div>

      {elapsed('hidden lg:block')}
    </div>
  );
}

export function Elapsed({ start, finish }: { start: string; finish?: string | null }) {
  const now = useNow();
  const end = finish ? new Date(finish) : now;

  const elapsed = (end.getTime() - new Date(start).getTime()) / 1000;

  return Math.ceil(elapsed);
}
