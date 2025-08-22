import { useCallback, useEffect } from 'react';

import { Link } from 'src/components/link';
import { useFeatureFlag } from 'src/hooks/feature-flag';
import { useNavigate, useSearchParams } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';
import { inArray } from 'src/utils/arrays';

import { Stepper, Step as StepperStep } from './stepper';
import { ServiceTypeStep } from './steps/00-service-type/service-type.step';
import { ImportProjectStep } from './steps/01-import-project/import-project.step';
import { BuilderStep } from './steps/02-builder/builder.step';
import { InstanceRegionStep } from './steps/03-instance-region/instance-region.step';
import { ReviewStep } from './steps/04-review/review.step';
import { InitialDeploymentStep } from './steps/05-initial-deployment/initial-deployment.step';

const T = createTranslate('modules.serviceCreation');

const steps = [
  'serviceType',
  'importProject',
  'builder',
  'instanceRegions',
  'review',
  'initialDeployment',
] as const;

type Step = (typeof steps)[number];

const isStep = (step: unknown): step is Step => steps.includes(step as Step);
const stepIndex = (step: Step) => steps.indexOf(step);

function isBefore(left: Step, right: Step) {
  return stepIndex(left) < stepIndex(right);
}

export function ServiceCreation() {
  const hasBuilderStep = useFeatureFlag('service-creation-builder-step');
  const initialStep = useInitialStep();
  const searchParams = useSearchParams();

  const currentStepParam = searchParams.get('step');
  const currentStep = isStep(currentStepParam) ? currentStepParam : 'serviceType';

  const serviceId = searchParams.get('serviceId');
  const type = searchParams.get('type');

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

  const stepperSteps =
    hasBuilderStep && type === 'git'
      ? (['importProject', 'builder', 'instanceRegions', 'review'] satisfies Step[])
      : (['importProject', 'instanceRegions', 'review'] satisfies Step[]);

  return (
    <div className="col gap-8">
      <Header step={currentStep} />

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
      {currentStep === 'builder' && <BuilderStep />}
      {currentStep === 'instanceRegions' && <InstanceRegionStep />}
      {currentStep === 'review' && <ReviewStep />}
      {currentStep === 'initialDeployment' && serviceId && <InitialDeploymentStep serviceId={serviceId} />}
    </div>
  );
}

function useInitialStep(): Step {
  const search = useSearchParams();

  const serviceType = search.get('service_type');
  const type = search.get('type');
  const repository = search.get('repository');
  const image = search.get('image');
  const builder = search.get('builder');
  const instanceType = search.get('instance_type');
  const regions = search.get('regions');

  if (serviceType !== 'web' && serviceType !== 'worker') {
    return 'serviceType';
  }

  if (type !== 'git' && type !== 'docker') {
    return 'serviceType';
  }

  if ((type === 'git' && repository === null) || (type === 'docker' && image === null)) {
    return 'importProject';
  }

  if (type === 'git' && builder === null) {
    return 'builder';
  }

  if (instanceType === null || regions === null) {
    return 'instanceRegions';
  }

  return 'review';
}

function Header({ step }: { step: Step }) {
  const search = useSearchParams();
  const type = search.get('type');
  const serviceId = search.get('serviceId');

  const serviceLink = (children: React.ReactNode) => {
    if (serviceId) {
      return (
        <Link className="text-link" to="/services/$serviceId" params={{ serviceId }}>
          {children}
        </Link>
      );
    }
  };

  const description = (step: Exclude<Step, 'serviceType'>) => {
    if (step === 'importProject') {
      return <T id={`importProject.description.${type as 'git' | 'docker'}`} />;
    }

    if (step === 'initialDeployment') {
      return <T id={`${step}.description`} values={{ link: serviceLink }} />;
    }

    return <T id={`${step}.description`} />;
  };

  return (
    <div className="col gap-2">
      <h1 className="typo-heading">
        <T id={`${step}.title`} />
      </h1>

      {step !== 'serviceType' && <p className="text-dim">{description(step)}</p>}
    </div>
  );
}
