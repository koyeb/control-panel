import { Meta, StoryFn } from '@storybook/react-vite';
import { useState } from 'react';
import { action } from 'storybook/actions';

import { createDate } from 'src/utils/date';
import { create } from 'src/utils/factories';

import { DeploymentsList } from './deployments-list';

export default {
  title: 'Components/DeploymentsList',
} satisfies Meta;

const service = create.service({
  activeDeploymentId: 'activeDeploymentId',
});

const active = create.computeDeployment({
  id: 'activeDeploymentId',
  status: 'HEALTHY',
  name: '0194e575',
  date: createDate('2024-06-01'),
  trigger: {
    type: 'git',
    branch: '',
    repository: '',
    commit: {
      sha: '',
      message: 'Update the code to make a feature work better',
      author: {
        name: '',
        url: '',
        avatar: 'https://www.gravatar.com/avatar?d=mp',
      },
    },
  },
});

const upcoming = [
  create.computeDeployment({
    status: 'PROVISIONING',
    name: '7dd1e079',
    date: createDate('2024-02-01'),
  }),
  create.computeDeployment({
    status: 'PENDING',
    name: '0252761c',
    date: createDate('2024-01-01'),
    trigger: { type: 'resume' },
  }),
];

const past = [
  create.computeDeployment({
    status: 'ERROR',
    name: '923fe52f',
    date: createDate('2024-01-01'),
    trigger: { type: 'redeploy' },
  }),
  create.computeDeployment({
    status: 'STOPPED',
    name: 'ac9fb79f',
    date: createDate('2024-01-01'),
    trigger: { type: 'initial' },
  }),
];

export const deploymentsList: StoryFn = () => {
  const [selected, setSelected] = useState(active);
  const [upcomingExpanded, setUpcomingExpanded] = useState(true);
  const [pastExpanded, setPastExpanded] = useState(false);

  return (
    <DeploymentsList
      service={service}
      activeDeployment={active}
      upcomingDeployments={upcoming}
      pastDeployments={past}
      totalDeployments={45}
      selectedDeployment={selected}
      onDeploymentSelected={setSelected}
      hasMoreDeployments
      isLoadingMoreDeployments={false}
      loadMoreDeployments={action('loadMore')}
      upcomingExpanded={upcomingExpanded}
      setUpcomingExpanded={setUpcomingExpanded}
      pastExpanded={pastExpanded}
      setPastExpanded={setPastExpanded}
    />
  );
};

deploymentsList.decorators = [
  (Story) => (
    <div className="max-w-72">
      <Story />
    </div>
  ),
];
