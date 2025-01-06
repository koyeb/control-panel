import { useIsFetching } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { useFormContext, useFormState } from 'react-hook-form';

import { Button, Floating, ButtonMenuItem, Menu, Tooltip } from '@koyeb/design-system';
import { IconChevronDown } from 'src/components/icons';
import { Shortcut } from 'src/components/shortcut';
import { useShortcut } from 'src/hooks/shortcut';
import { createTranslate } from 'src/intl/translate';
import { inArray } from 'src/utils/arrays';

import { ServiceForm } from '../service-form.types';
import { useWatchServiceForm } from '../use-service-form';

const T = createTranslate('serviceForm.submitButton');

type SubmitButtonProps = {
  loading: boolean;
};

export function SubmitButton({ loading }: SubmitButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const isNewService = useWatchServiceForm('meta.serviceId') === null;
  const hasPreviousBuild = useWatchServiceForm('meta.hasPreviousBuild');

  const deploymentSource = useWatchServiceForm('source.type');
  const hasBuild = inArray(deploymentSource, ['git', 'archive']);

  const { setValue } = useFormContext<ServiceForm>();
  const saveOnly = useWatchServiceForm('meta.saveOnly');

  const { errors } = useFormState();
  const isVerifyingDockerImage = useIsFetching({ queryKey: ['verifyDockerImage'] }) > 0;
  const disabled = Object.keys(errors).length > 0 || isVerifyingDockerImage;

  const showBuildOptions = hasBuild && !isNewService;

  const submitButtonRef = useRef<HTMLButtonElement>(null);

  const deploy = (options: { skipBuild?: boolean; saveOnly?: boolean } = {}) => {
    setValue('meta.skipBuild', Boolean(options.skipBuild));
    setValue('meta.saveOnly', Boolean(options.saveOnly));

    setMenuOpen(false);
    submitButtonRef.current?.form?.requestSubmit();
  };

  useShortcut(['meta', 'D'], () => deploy());
  useShortcut(['meta', 'S'], () => hasPreviousBuild && deploy({ skipBuild: true }));

  const saveButton = (
    <Button
      color="gray"
      disabled={disabled}
      loading={loading && saveOnly}
      onClick={() => deploy({ saveOnly: true })}
    >
      <T id="save" />
    </Button>
  );

  const deployWithoutBuildOptionsButton = (
    <Button disabled={disabled} loading={loading && !saveOnly} onClick={() => deploy()}>
      <T id={isNewService ? 'deploy' : 'saveDeploy'} />
    </Button>
  );

  const deployWithBuildOptionsButton = (
    <Floating
      open={menuOpen}
      setOpen={setMenuOpen}
      placement="bottom-end"
      offset={8}
      renderReference={(ref, props) => (
        <Button
          ref={ref}
          {...props}
          disabled={disabled}
          loading={loading && !saveOnly}
          onClick={() => setMenuOpen(true)}
        >
          <T id={isNewService ? 'deploy' : 'saveDeploy'} />
          <div>
            <IconChevronDown />
          </div>
        </Button>
      )}
      renderFloating={(ref, props) => (
        <Menu ref={ref} {...props}>
          <ButtonMenuItem onClick={() => deploy()} className="max-w-72 text-start">
            <BuildOption
              label={<T id="withBuild.label" />}
              description={<T id="withBuild.description" />}
              shortcut={<Shortcut keystrokes={['meta', 'D']} />}
            />
          </ButtonMenuItem>

          <Tooltip placement="top" content={!hasPreviousBuild && <T id="noPreviousBuild" />}>
            {(props) => (
              <div {...props}>
                <ButtonMenuItem
                  onClick={() => deploy({ skipBuild: true })}
                  disabled={!hasPreviousBuild}
                  className="max-w-72 text-start"
                >
                  <BuildOption
                    label={<T id="withoutBuild.label" />}
                    description={<T id="withoutBuild.description" />}
                    shortcut={<Shortcut keystrokes={['meta', 'S']} />}
                  />
                </ButtonMenuItem>
              </div>
            )}
          </Tooltip>
        </Menu>
      )}
    />
  );

  return (
    <div className="row gap-2">
      <button ref={submitButtonRef} type="submit" form="service-form" className="hidden" />
      {showBuildOptions ? deployWithBuildOptionsButton : deployWithoutBuildOptionsButton}
      {!isNewService && saveButton}
    </div>
  );
}

type BuildOptionProps = {
  label: React.ReactNode;
  description: React.ReactNode;
  shortcut: React.ReactNode;
};

function BuildOption({ label, description, shortcut }: BuildOptionProps) {
  return (
    <div className="row items-center justify-between gap-2">
      <div>
        <div>{label}</div>
        <div className="text-xs text-dim">{description}</div>
      </div>

      {shortcut}
    </div>
  );
}
