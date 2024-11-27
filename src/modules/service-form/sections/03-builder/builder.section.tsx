import { ControlledSelectBox } from 'src/components/controlled';
import { IconPackage } from 'src/components/icons';
import IconDocker from 'src/icons/docker.svg?react';
import { Translate } from 'src/intl/translate';

import { ServiceFormSection } from '../../components/service-form-section';
import { BuilderType, ServiceForm } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

import { BuildpackOptions } from './buildpack-options';
import { DockerfileOptions } from './dockerfile-options';

const T = Translate.prefix('serviceForm.builder');

export function BuilderSection() {
  const builderType = useWatchServiceForm('builder.type');

  return (
    <ServiceFormSection
      section="builder"
      title={<SectionTitle />}
      expandedTitle={<T id="expandedTitle" />}
      description={<T id="description" />}
    >
      <div className="gaps mb-5 grid grid-cols-1 md:grid-cols-2">
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

function SectionTitle() {
  const builderType = useWatchServiceForm('builder.type');

  const { Icon, title } =
    builderType === 'buildpack'
      ? { Icon: IconPackage, title: <T id="buildpack" /> }
      : { Icon: IconDocker, title: <T id="dockerfile" /> };

  return (
    <div className="row items-center gap-2">
      <Icon className="text-icon size-5" />
      {title}
    </div>
  );
}

type BuilderTypeOptionProps = {
  type: BuilderType;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
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
