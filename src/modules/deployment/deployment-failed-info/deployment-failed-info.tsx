import clsx from 'clsx';
import React from 'react';

import { ComputeDeployment } from 'src/api/model';
import { DocumentationLink } from 'src/components/documentation-link';
import { IconInfo } from 'src/components/icons';
import { createTranslate } from 'src/intl/translate';
import { createArray } from 'src/utils/arrays';

const T = createTranslate('modules.deployment.deploymentFailedInfo');

type DeploymentFailedInfoProps = {
  deployment: ComputeDeployment;
  layout: 'row' | 'column';
  className?: string;
  after?: React.ReactNode;
};

export function DeploymentFailedInfo({ deployment, layout, className, after }: DeploymentFailedInfoProps) {
  const troubleshootingLink = (children: React.ReactNode[]) => (
    <DocumentationLink path="/docs/build-and-deploy/troubleshooting-tips">{children}</DocumentationLink>
  );

  if (deployment.build?.status === 'failed') {
    return (
      <DeploymentFailedCard
        title={<T id="buildFailed.title" />}
        cause={{
          before: <T id="buildFailed.cause.before" />,
          commonCases: createArray(3, (index) => (
            <T id={`buildFailed.cause.reason${(index + 1) as 1 | 2 | 3}`} />
          )),
        }}
        solution={{
          line1: <T id="buildFailed.solution.line1" values={{ link: troubleshootingLink }} />,
          line2: <T id="buildFailed.solution.line2" />,
        }}
        layout={layout}
        className={className}
        after={after}
      />
    );
  }

  if (deployment.status === 'error') {
    return (
      <DeploymentFailedCard
        title={<T id="runtimeFailed.title" />}
        cause={{
          before: <T id="runtimeFailed.cause.before" />,
          commonCases: createArray(3, (index) => (
            <T id={`runtimeFailed.cause.reason${(index + 1) as 1 | 2 | 3}`} />
          )),
        }}
        solution={{
          line1: <T id="runtimeFailed.solution.line1" values={{ link: troubleshootingLink }} />,
          line2: <T id="runtimeFailed.solution.line2" />,
        }}
        layout={layout}
        after={after}
      />
    );
  }
}

type DeploymentFailedCardProps = {
  title: React.ReactNode;
  cause: {
    before: React.ReactNode;
    commonCases: React.ReactNode[];
  };
  solution: {
    line1: React.ReactNode;
    line2: React.ReactNode;
  };
  layout: 'row' | 'column';
  className?: string;
  after?: React.ReactNode;
};

function DeploymentFailedCard({
  title,
  cause,
  solution,
  layout,
  className,
  after,
}: DeploymentFailedCardProps) {
  return (
    <div className={clsx('rounded-lg border', className)}>
      <div className="row items-center gap-2 rounded-t-lg bg-red/10 px-3 py-2 text-red">
        <div>
          <IconInfo className="size-4" />
        </div>
        {title}
      </div>

      <div
        className={clsx('col gap-4 px-3 py-4', {
          'sm:row sm:gap-8': layout === 'row',
        })}
      >
        <div className="col flex-1 gap-2">
          <strong>
            <T id="labels.cause" />
          </strong>

          <div className="col gap-1">
            <p>{cause.before}</p>

            <ul className="list-disc pl-6">
              {cause.commonCases.map((line, index) => (
                <li key={index}>{line}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="col flex-1 gap-2">
          <strong>
            <T id="labels.solution" />
          </strong>

          <p>{solution.line1}</p>
          <p>{solution.line2}</p>
        </div>

        {after}
      </div>
    </div>
  );
}
