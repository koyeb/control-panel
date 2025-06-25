import { useNavigate, useSearch } from '@tanstack/react-router';

import { routes } from 'src/application/routes';
import { Link } from 'src/components/link';
import { createTranslate } from 'src/intl/translate';
import { inArray } from 'src/utils/arrays';
import { snakeToCamelDeep } from 'src/utils/object';

import { Stepper, Step as StepperStep } from './stepper';
import { ServiceTypeStep } from './steps/00-service-type/service-type.step';
import { ImportProjectStep } from './steps/01-import-project/import-project.step';
import { InstanceRegionStep } from './steps/02-instance-region/instance-region.step';
import { ReviewStep } from './steps/03-review/review.step';
import { InitialDeploymentStep } from './steps/04-initial-deployment/initial-deployment.step';

const T = createTranslate('modules.serviceCreation');

type Step = (typeof steps)[number];
const steps = ['serviceType', 'importProject', 'instanceRegions', 'review', 'initialDeployment'] as const;

function stepIndex(step: Step) {
  return steps.indexOf(step);
}

function isBefore(left: Step, right: Step) {
  return stepIndex(left) < stepIndex(right);
}

const stepperSteps = ['importProject', 'instanceRegions', 'review'] as const;

export function ServiceCreation() {
  const { step: currentStep, serviceId } = snakeToCamelDeep(useSearch({ from: '/_main/services/new' }));
  const navigate = useNavigate({ from: '/services/new' });

  const onNext = (serviceId?: string) => {
    const index = stepIndex(currentStep);
    const nextStep = steps.at(index + 1);

    if (nextStep) {
      void navigate({ to: '.', search: { step: nextStep, service_id: serviceId } });
    }
  };

  const serviceLink = (children: React.ReactNode) => {
    if (serviceId) {
      return (
        <Link className="text-link" href={routes.service.overview(serviceId)}>
          {children}
        </Link>
      );
    }
  };

  return (
    <div className="col gap-8">
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
              onClick={
                isBefore(step, currentStep)
                  ? () => void navigate({ to: '.', search: (prev) => ({ ...prev, step }) })
                  : undefined
              }
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
      {currentStep === 'review' && <ReviewStep onNext={onNext} />}
      {currentStep === 'initialDeployment' && <InitialDeploymentStep serviceId={serviceId as string} />}
    </div>
  );
}
