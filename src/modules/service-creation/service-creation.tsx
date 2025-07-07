import { getRouteApi } from '@tanstack/react-router';
import { useCallback } from 'react';

import { useInstances, useRegions } from 'src/api/hooks/catalog';
import { useGithubApp, useRepositories } from 'src/api/hooks/git';
import { Link } from 'src/components/link';
import { createTranslate } from 'src/intl/translate';
import { inArray } from 'src/utils/arrays';

import { Stepper, Step as StepperStep } from './stepper';
import { ServiceTypeStep } from './steps/00-service-type/service-type.step';
import { ImportProjectStep } from './steps/01-import-project/import-project.step';
import { InstanceRegionStep } from './steps/02-instance-region/instance-region.step';
import { ReviewStep } from './steps/03-review/review.step';
import { InitialDeploymentStep } from './steps/04-initial-deployment/initial-deployment.step';

const T = createTranslate('modules.serviceCreation');

const steps = ['serviceType', 'importProject', 'instanceRegions', 'review', 'initialDeployment'] as const;
type Step = (typeof steps)[number];

const stepperSteps = ['importProject', 'instanceRegions', 'review'] satisfies Step[];

function isBefore(left: Step, right: Step) {
  return steps.indexOf(left) < steps.indexOf(right);
}

const route = getRouteApi('/_main/services/new');

export function ServiceCreation() {
  const { step: currentStep, serviceId } = route.useSearch();
  const navigate = route.useNavigate();

  const setCurrentStep = useCallback(
    (step: Step) => navigate({ search: (prev) => ({ ...prev, step }) }),
    [navigate],
  );

  const serviceLink = (children: React.ReactNode) => {
    if (serviceId) {
      return (
        <Link className="text-link" to="/services/$serviceId" params={{ serviceId }}>
          {children}
        </Link>
      );
    }
  };

  return (
    <div className="col gap-8">
      <PrefetchResources />

      <div className="col gap-2">
        <h1 className="typo-heading">
          <T id={`${currentStep}.title`} />
        </h1>

        {currentStep !== 'serviceType' && (
          <p className="text-dim">
            <T id={`${currentStep}.description`} values={{ link: serviceLink }} />
          </p>
        )}
      </div>

      {inArray(currentStep, stepperSteps) && (
        <Stepper>
          {stepperSteps.map((step, index) => (
            <StepperStep
              key={step}
              active={step === currentStep}
              onClick={isBefore(step, currentStep) ? () => setCurrentStep(step) : undefined}
            >
              <span className="font-medium">{<T id={`stepper.${step}`} />}</span>
              <span className="text-xs text-dim">
                <T id="activeStep" values={{ position: index + 1, total: stepperSteps.length }} />
              </span>
            </StepperStep>
          ))}
        </Stepper>
      )}

      {currentStep === 'serviceType' && <ServiceTypeStep />}
      {currentStep === 'importProject' && <ImportProjectStep />}
      {currentStep === 'instanceRegions' && <InstanceRegionStep />}
      {currentStep === 'review' && <ReviewStep />}
      {currentStep === 'initialDeployment' && serviceId && <InitialDeploymentStep serviceId={serviceId} />}
    </div>
  );
}

// avoid the parent component to unmount and remount several times
function PrefetchResources() {
  useGithubApp();
  useRepositories('');
  useInstances();
  useRegions();

  return null;
}
