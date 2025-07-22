import { useEffect } from 'react';
import { useFormContext, useFormState } from 'react-hook-form';

import { ControlledInput } from 'src/components/controlled';
import { DockerImageHelperText } from 'src/components/docker-image-input/docker-image-helper-text';
import { useVerifyDockerImage } from 'src/components/docker-image-input/use-verify-docker-image';
import { useFormValues } from 'src/hooks/form';
import { IconDocker } from 'src/icons';
import { createTranslate } from 'src/intl/translate';

import { useGenerateServiceName } from '../../00-service-name/use-generate-service-name';
import { ServiceForm } from '../../../service-form.types';

const T = createTranslate('modules.serviceForm.source.docker');

export function DockerImageField() {
  const t = T.useTranslate();

  const generateServiceName = useGenerateServiceName();
  const { setError, clearErrors } = useFormContext<ServiceForm>();
  const { source } = useFormValues<ServiceForm>();
  const { errors } = useFormState<ServiceForm>();

  const { verifying, verified, error, retry } = useVerifyDockerImage(
    source.docker.image,
    source.docker.registrySecret ?? undefined,
  );

  useEffect(() => {
    if (verifying) {
      clearErrors('source.docker.image');
    } else if (error) {
      setError('source.docker.image', error);
    }
  }, [verifying, error, clearErrors, setError]);

  useEffect(() => {
    if (verified) {
      generateServiceName();
    }
  }, [verified, generateServiceName]);

  return (
    <ControlledInput<ServiceForm, 'source.docker.image'>
      name="source.docker.image"
      label={<T id="imageLabel" />}
      placeholder={t('imagePlaceholder')}
      helpTooltip={<T id="imageTooltip" />}
      helperText={
        <DockerImageHelperText
          verifying={verifying}
          verified={verified}
          error={errors.source?.docker?.image}
          onRetry={retry}
        />
      }
      start={
        <span className="row items-center self-stretch pl-1">
          <IconDocker className="icon" />
        </span>
      }
      className="max-w-md"
    />
  );
}
