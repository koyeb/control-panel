import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { TabButton, TabButtons } from '@koyeb/design-system';
import { useFeatureFlag } from 'src/hooks/feature-flag';
import { Translate } from 'src/intl/translate';

import { ServiceFormSection } from '../../components/service-form-section';
import { ServiceForm } from '../../service-form.types';

import { EnvironmentVariables } from './environment-variables';
import { Files } from './files';

const T = Translate.prefix('serviceForm.environmentVariables');

const tabs = ['environmentVariables', 'files'] as const;

export function EnvironmentVariablesSection() {
  const variables = useFormContext<ServiceForm>().watch('environmentVariables');
  const [currentTab, setCurrentTab] = useState<(typeof tabs)[number]>(tabs[0]);

  const hasMountFiles = useFeatureFlag('mount-files');

  return (
    <ServiceFormSection
      section="environmentVariables"
      title={<T id="title" values={{ count: variables.filter((field) => field.name !== '').length }} />}
      description={<T id="description" />}
      expandedTitle={<T id="expandedTitle" />}
      className="col gaps"
    >
      {hasMountFiles && (
        <TabButtons>
          {tabs.map((tab) => (
            <TabButton key={tab} selected={tab === currentTab} onClick={() => setCurrentTab(tab)}>
              <T id={`tabs.${tab}`} />
            </TabButton>
          ))}
        </TabButtons>
      )}

      {currentTab === 'environmentVariables' && <EnvironmentVariables />}
      {currentTab === 'files' && <Files />}
    </ServiceFormSection>
  );
}
