import { AccordionHeader, AccordionSection, Button, SelectBox } from '@koyeb/design-system';
import { useState } from 'react';
import { FormProvider, useController, useForm } from 'react-hook-form';

import { BuilderType } from 'src/api/model';
import { ControlledCheckbox } from 'src/components/controlled';
import { LinkButton } from 'src/components/link';
import { OverridableInput } from 'src/components/overridable-input';
import { ShellCommandInput } from 'src/components/shell-command-input';
import { handleSubmit } from 'src/hooks/form';
import { useMount } from 'src/hooks/lifecycle';
import { useNavigate, useSearchParams } from 'src/hooks/router';
import { IconPackage } from 'src/icons';
import IconDocker from 'src/icons/docker.svg?react';
import { Translate, createTranslate } from 'src/intl/translate';

const T = createTranslate('modules.serviceCreation.builder');

export function BuilderStep() {
  const builder = useSearchParams().get('builder');
  const navigate = useNavigate();

  const setBuilder = (builder: BuilderType) => {
    navigate({ search: (prev) => ({ ...prev, builder }), replace: true });
  };

  useMount(() => {
    if (!builder) {
      setBuilder('buildpack');
    }
  });

  if (builder === null) {
    return null;
  }

  return (
    <div className="col gap-8">
      <BuilderSelection builder={builder as BuilderType} onChange={setBuilder} />
      <BuilderConfiguration builder={builder as BuilderType} />
    </div>
  );
}

type BuilderSelectionProps = {
  builder: BuilderType;
  onChange: (builder: BuilderType) => void;
};

function BuilderSelection({ builder, onChange }: BuilderSelectionProps) {
  return (
    <div className="col gap-4 sm:row">
      <SelectBox
        type="radio"
        checked={builder === 'buildpack'}
        onChange={() => onChange('buildpack')}
        icon={<IconPackage className="icon" />}
        title={<T id="buildpack.title" />}
        description={<T id="buildpack.description" />}
      />

      <SelectBox
        type="radio"
        checked={builder === 'dockerfile'}
        onChange={() => onChange('dockerfile')}
        icon={<IconDocker className="icon" />}
        title={<T id="dockerfile.title" />}
        description={<T id="dockerfile.description" />}
      />
    </div>
  );
}

type BuilderForm = {
  buildpack: {
    buildCommand: string | null;
    runCommand: string | null;
    workDirectory: string | null;
    privileged: boolean;
  };
  dockerfile: {
    dockerfile: string | null;
    entrypoint: string[] | null;
    command: string | null;
    args: string[] | null;
    target: string | null;
    workDirectory: string | null;
    privileged: boolean;
  };
};

function BuilderConfiguration({ builder }: { builder: BuilderType }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const form = useForm<BuilderForm>({
    defaultValues: {
      buildpack: {
        buildCommand: null,
        runCommand: null,
        workDirectory: null,
        privileged: false,
      },
      dockerfile: {
        dockerfile: null,
        entrypoint: null,
        command: null,
        args: null,
        target: null,
        workDirectory: null,
        privileged: false,
      },
    },
  });

  const onSubmit = ({ buildpack, dockerfile }: BuilderForm) => {
    navigate({
      search: (prev) => ({
        ...prev,

        step: 'instanceRegions',

        ...(builder === 'buildpack' && {
          run_command: buildpack.runCommand,
          build_command: buildpack.buildCommand,
          workdir: buildpack.workDirectory,
          privileged: buildpack.privileged,
        }),

        ...(builder === 'dockerfile' && {
          dockerfile: dockerfile.dockerfile,
          entrypoint: dockerfile.entrypoint,
          command: dockerfile.command,
          args: dockerfile.args,
          target: dockerfile.target,
          workdir: dockerfile.workDirectory,
          privileged: dockerfile.privileged,
        }),
      }),
    });
  };

  return (
    <form onSubmit={handleSubmit(form, onSubmit)} className="col gap-6">
      <div className="rounded-md border">
        <AccordionSection
          isExpanded={expanded}
          header={
            <AccordionHeader expanded={expanded} setExpanded={setExpanded} className="rounded-t-md">
              <T id={`${builder}.configuration.title`} />
            </AccordionHeader>
          }
        >
          <div className="col gap-6 px-3 pt-2 pb-4">
            <div>
              <T id={`${builder}.configuration.description`} />
            </div>

            <FormProvider {...form}>
              {builder === 'buildpack' && <BuildpackConfiguration />}
              {builder === 'dockerfile' && <DockerfileConfiguration />}
            </FormProvider>
          </div>
        </AccordionSection>
      </div>

      <div className="row gap-4">
        <LinkButton
          color="gray"
          to="/services/new"
          search={(prev) => ({ ...prev, step: 'importProject' })}
          className="self-start"
        >
          <Translate id="common.back" />
        </LinkButton>

        <Button type="submit" className="self-start">
          <Translate id="common.next" />
        </Button>
      </div>
    </form>
  );
}

function BuildpackConfiguration() {
  const t = T.useTranslate();

  return (
    <div className="col gap-4">
      <OverridableInput<BuilderForm, 'buildpack.buildCommand'>
        name="buildpack.buildCommand"
        label={<T id="buildpack.configuration.runCommand.label" />}
        helpTooltip={<T id="buildpack.configuration.runCommand.tooltip" />}
      />

      <OverridableInput<BuilderForm, 'buildpack.runCommand'>
        name="buildpack.runCommand"
        label={<T id="buildpack.configuration.runCommand.label" />}
        helpTooltip={<T id="buildpack.configuration.runCommand.tooltip" />}
      />

      <OverridableInput<BuilderForm, 'buildpack.workDirectory'>
        name="buildpack.workDirectory"
        label={<T id="buildpack.configuration.workDirectory.label" />}
        helpTooltip={<T id="buildpack.configuration.workDirectory.tooltip" />}
        placeholder={t('buildpack.configuration.workDirectory.placeholder')}
      />

      <ControlledCheckbox<BuilderForm, 'buildpack.privileged'>
        name="buildpack.privileged"
        label={<T id="buildpack.configuration.privileged.label" />}
        helpTooltip={<T id="buildpack.configuration.privileged.tooltip" />}
      />
    </div>
  );
}

function DockerfileConfiguration() {
  const t = T.useTranslate();

  const entrypoint = useController<BuilderForm, 'dockerfile.entrypoint'>({ name: 'dockerfile.entrypoint' });
  const command = useController<BuilderForm, 'dockerfile.command'>({ name: 'dockerfile.command' });
  const args = useController<BuilderForm, 'dockerfile.args'>({ name: 'dockerfile.args' });

  return (
    <div className="col gap-4">
      <OverridableInput<BuilderForm, 'dockerfile.dockerfile'>
        name="dockerfile.dockerfile"
        label={<T id="dockerfile.configuration.dockerfileLocation.label" />}
        helpTooltip={<T id="dockerfile.configuration.dockerfileLocation.tooltip" />}
        placeholder={t('dockerfile.configuration.dockerfileLocation.placeholder')}
      />

      <ShellCommandInput
        label={<T id="dockerfile.configuration.entrypoint.label" />}
        helpTooltip={<T id="dockerfile.configuration.entrypoint.tooltip" />}
        instruction="ENTRYPOINT"
        value={entrypoint.field.value}
        onChange={entrypoint.field.onChange}
        error={entrypoint.fieldState.error?.message}
        className="w-full max-w-md"
      />

      <ShellCommandInput
        label={<T id="dockerfile.configuration.command.label" />}
        helpTooltip={<T id="dockerfile.configuration.command.tooltip" />}
        instruction="CMD"
        value={command.field.value === null ? null : [command.field.value, ...(args.field.value ?? [])]}
        onChange={(value) => {
          command.field.onChange(value ? (value[0] ?? '') : null);
          args.field.onChange(value ? value.slice(1) : null);
        }}
        error={command.fieldState.error?.message ?? args.fieldState.error?.message}
        className="w-full max-w-md"
      />

      <OverridableInput<BuilderForm, 'dockerfile.target'>
        name="dockerfile.target"
        label={<T id="dockerfile.configuration.target.label" />}
        helpTooltip={<T id="dockerfile.configuration.target.tooltip" />}
      />

      <OverridableInput<BuilderForm, 'dockerfile.workDirectory'>
        name="dockerfile.workDirectory"
        label={<T id="buildpack.configuration.workDirectory.label" />}
        helpTooltip={<T id="buildpack.configuration.workDirectory.tooltip" />}
        placeholder={t('buildpack.configuration.workDirectory.placeholder')}
      />

      <ControlledCheckbox<BuilderForm, 'dockerfile.privileged'>
        name="dockerfile.privileged"
        label={<T id="buildpack.configuration.privileged.label" />}
        helpTooltip={<T id="buildpack.configuration.privileged.tooltip" />}
      />
    </div>
  );
}
