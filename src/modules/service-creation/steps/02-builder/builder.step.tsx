import { Button, SelectBox } from '@koyeb/design-system';

import { IconPackage } from 'src/components/icons';
import { useMount } from 'src/hooks/lifecycle';
import { useNavigate, useSearchParams } from 'src/hooks/router';
import IconDocker from 'src/icons/docker.svg?react';
import { Translate, createTranslate } from 'src/intl/translate';

const T = createTranslate('modules.serviceCreation.builder');

export function BuilderStep() {
  const builder = useSearchParams().get('builder');
  const navigate = useNavigate();

  const setBuilder = (builder: 'buildpack' | 'dockerfile') => {
    navigate({ search: (prev) => ({ ...prev, builder }) });
  };

  useMount(() => {
    if (!builder) {
      setBuilder('buildpack');
    }
  });

  return (
    <div className="col items-start gap-6">
      <div className="col gap-4 sm:row">
        <SelectBox
          type="radio"
          checked={builder === 'buildpack'}
          onChange={() => setBuilder('buildpack')}
          icon={<IconPackage className="icon" />}
          title={<T id="buildpack.title" />}
          description={<T id="buildpack.description" />}
          className="max-w-sm"
        />

        <SelectBox
          type="radio"
          checked={builder === 'dockerfile'}
          onChange={() => setBuilder('dockerfile')}
          icon={<IconDocker className="icon" />}
          title={<T id="dockerfile.title" />}
          description={<T id="dockerfile.description" />}
          className="max-w-sm"
        />
      </div>

      <Button
        color="gray"
        onClick={() => navigate({ search: (prev) => ({ ...prev, step: 'instanceRegions' }) })}
      >
        <Translate id="common.next" />
      </Button>
    </div>
  );
}
