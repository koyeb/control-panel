import { useCallback, useEffect } from 'react';

import { useInstances, useRegions } from 'src/api/hooks/catalog';
import { useGithubApp, useRepositories } from 'src/api/hooks/git';
import { Link } from 'src/components/link';
import { useNavigate, useSearchParams } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';
import { inArray } from 'src/utils/arrays';
import { enumIndex, isEnumValue } from 'src/utils/enums';

import { Stepper, Step as StepperStep } from './stepper';
import { ServiceTypeStep } from './steps/00-service-type/service-type.step';
import { ImportProjectStep } from './steps/01-import-project/import-project.step';
import { InstanceRegionStep } from './steps/02-instance-region/instance-region.step';
import { ReviewStep } from './steps/03-review/review.step';
import { InitialDeploymentStep } from './steps/04-initial-deployment/initial-deployment.step';

const T = createTranslate('modules.serviceCreation');

enum Step {
  serviceType = 'serviceType',
  importProject = 'importProject',
  instanceRegions = 'instanceRegions',
  review = 'review',
  initialDeployment = 'initialDeployment',
}

const isStep = isEnumValue(Step);
const stepIndex = enumIndex(Step);

function isBefore(left: Step, right: Step) {
  return stepIndex(left) < stepIndex(right);
}

const stepperSteps = [Step.importProject, Step.instanceRegions, Step.review] as const;

export function ServiceCreation() {
  const initialStep = useInitialStep();
  const currentStepParam = useSearchParams().get('step');
  const currentStep = isStep(currentStepParam) ? currentStepParam : Step.serviceType;
  const serviceId = useSearchParams().get('serviceId');
  const navigate = useNavigate();

  const setCurrentStep = useCallback(
    (step: Step) => {
      navigate({ search: (prev) => ({ ...prev, step }) });
    },
    [navigate],
  );

  useEffect(() => {
    if (!isStep(currentStepParam)) {
      setCurrentStep(initialStep);
    }
  }, [currentStepParam, initialStep, setCurrentStep]);

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

        {currentStep !== Step.serviceType && (
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

      {currentStep === Step.serviceType && <ServiceTypeStep />}
      {currentStep === Step.importProject && <ImportProjectStep />}
      {currentStep === Step.instanceRegions && <InstanceRegionStep />}
      {currentStep === Step.review && <ReviewStep />}
      {currentStep === Step.initialDeployment && serviceId && <InitialDeploymentStep serviceId={serviceId} />}
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

function useInitialStep(): Step {
  const search = useSearchParams();

  const serviceType = search.get('service_type');
  const type = search.get('type');
  const repository = search.get('repository');
  const image = search.get('image');
  const instanceType = search.get('instance_type');
  const regions = search.get('regions');

  if (serviceType !== 'web' && serviceType !== 'worker') {
    return Step.serviceType;
  }

  if (type !== 'git' && type !== 'docker') {
    return Step.serviceType;
  }

  if ((type === 'git' && repository === null) || (type === 'docker' && image === null)) {
    return Step.importProject;
  }

  if (instanceType === null || regions === null) {
    return Step.instanceRegions;
  }

  return Step.review;
}
