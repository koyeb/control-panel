import { SvgComponent } from 'src/application/types';
import { ControlledSelectBox } from 'src/components/controlled';
import { IconDocker, IconPackage } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { BuilderType } from 'src/model';

import { ServiceFormSection } from '../../components/service-form-section';
import { ServiceForm } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

import { BuildpackOptions } from './buildpack-options';
import { DockerfileOptions } from './dockerfile-options';

const T = createTranslate('modules.serviceForm.builder');

export function BuilderSection() {
  const builderType = useWatchServiceForm('builder.type');

  return (
    <ServiceFormSection
      section="builder"
      title={<T id="title" />}
      action={<T id="action" />}
      summary={<Summary />}
    >
      <div className="mb-5 grid grid-cols-1 gaps md:grid-cols-2">
        <BuilderTypeOption
          type="buildpack"
          Icon={IconPackage}
          title={<T id="buildpack" />}
          description={<T id="buildpackDescription" />}
        />

        <BuilderTypeOption
          type="dockerfile"
          Icon={IconDocker}
          title={<T id="dockerfile" />}
          description={<T id="dockerfileDescription" />}
        />
      </div>

      {builderType === 'buildpack' && <BuildpackOptions />}
      {builderType === 'dockerfile' && <DockerfileOptions />}
    </ServiceFormSection>
  );
}

function Summary() {
  const builderType = useWatchServiceForm('builder.type');

  const { Icon, title } = {
    buildpack: { Icon: IconPackage, title: <T id="buildpack" /> },
    dockerfile: { Icon: IconDocker, title: <T id="dockerfile" /> },
  }[builderType];

  return (
    <div className="row items-center gap-2">
      <Icon className="size-4 text-icon" />
      {title}
    </div>
  );
}

type BuilderTypeOptionProps = {
  type: BuilderType;
  Icon: SvgComponent;
  title: React.ReactNode;
  description: React.ReactNode;
};

function BuilderTypeOption({ type, Icon, title, description }: BuilderTypeOptionProps) {
  return (
    <ControlledSelectBox<ServiceForm, 'builder.type'>
      name="builder.type"
      type="radio"
      value={type}
      icon={<Icon className="icon" />}
      title={title}
      description={description}
    />
  );
}
