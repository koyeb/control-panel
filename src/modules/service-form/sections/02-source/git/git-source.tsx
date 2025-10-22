import { TabButton, TabButtons } from '@koyeb/design-system';
import clsx from 'clsx';
import { Controller } from 'react-hook-form';

import { useGithubApp } from 'src/api';
import { ControlledSelect } from 'src/components/forms';
import { createTranslate } from 'src/intl/translate';
import { identity } from 'src/utils/generic';

import { ServiceForm } from '../../../service-form.types';
import { useWatchServiceForm } from '../../../use-service-form';

import { OrganizationRepository } from './organization-repository';
import { PublicRepository } from './public-repository';

const T = createTranslate('modules.serviceForm.source.git');

export function GitSource() {
  const githubApp = useGithubApp();
  const repositoryType = useWatchServiceForm('source.git.repositoryType');

  return (
    <>
      <ControlledSelect<ServiceForm, 'source.git.repositoryType'>
        name="source.git.repositoryType"
        className="sm:!hidden"
        label={<T id="repositoryTypeLabel" />}
        items={['organization', 'public']}
        getKey={identity}
        itemToString={identity}
        itemToValue={identity}
        renderItem={(type) =>
          ({
            organization: githubApp?.organizationName,
            public: <T id="publicRepository" />,
          })[type]
        }
      />

      <div className="hidden sm:block">
        <Controller
          name="source.git.repositoryType"
          render={({ field }) => (
            <TabButtons>
              <TabButton
                selected={field.value === 'organization'}
                onClick={() => field.onChange('organization')}
              >
                {githubApp?.organizationName ?? <T id="organizationRepository" />}
              </TabButton>
              <TabButton selected={field.value === 'public'} onClick={() => field.onChange('public')}>
                <T id="publicRepository" />
              </TabButton>
            </TabButtons>
          )}
        />
      </div>

      <div className={clsx('col gap-4', repositoryType !== 'organization' && '!hidden')}>
        <OrganizationRepository />
      </div>

      <div className={clsx('col gap-4', repositoryType !== 'public' && '!hidden')}>
        <PublicRepository />
      </div>
    </>
  );
}
